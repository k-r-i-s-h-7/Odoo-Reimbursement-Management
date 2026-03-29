const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertCurrency } = require('../utils/currencyConverter');

const getPendingRequests = async (req, res) => {
  const managerId = req.user.id; 
  const COMPANY_BASE_CURRENCY = "INR"; 

  try {
    const pendingRequests = await prisma.approvalRequest.findMany({
      where: {
        approverId: managerId,
        status: 'PENDING',
        expense: {
          currentStep: { equals: prisma.approvalRequest.fields.sequenceOrder }
        }
      },
      include: { 
        expense: { 
          include: { employee: true } 
        } 
      }
    });

    const enrichedRequests = await Promise.all(pendingRequests.map(async (request) => {
      // Using schema field: submittedAmount
      const convertedValue = await convertCurrency(
        request.expense.submittedAmount, 
        request.expense.submittedCurrency, 
        COMPANY_BASE_CURRENCY
      );
      
      return {
        ...request,
        calculatedBaseAmount: convertedValue.toFixed(2),
        baseCurrency: COMPANY_BASE_CURRENCY
      };
    }));

    res.json(enrichedRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const processApproval = async (req, res) => {
  const { requestId, status, comments } = req.body; 

  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { expense: true }
    });

    if (!request || request.status !== 'PENDING') {
      return res.status(400).json({ error: "Request not found or already processed." });
    }

    // 1. Update ApprovalRequest (Uses your actionedAt field)
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status, comments, actionedAt: new Date() }
    });

    // 2. Handle Rejection
    if (status === 'REJECTED') {
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { status: 'REJECTED' }
      });
      return res.json({ message: "Expense Rejected." });
    }

    // 3. Handle Approval & Sequence Flow
    const nextRequest = await prisma.approvalRequest.findFirst({
      where: {
        expenseId: request.expenseId,
        sequenceOrder: request.sequenceOrder + 1
      }
    });

    if (nextRequest) {
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { currentStep: request.sequenceOrder + 1 }
      });
      res.json({ message: "Approved. Moved to next step." });
    } else {
      // Final Step reached
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { status: 'APPROVED' } // No approvalDate in schema, so we just set status
      });
      res.json({ message: "Expense Fully Approved." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPendingRequests, processApproval };