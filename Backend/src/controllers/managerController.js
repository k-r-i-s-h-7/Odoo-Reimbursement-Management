const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { convertCurrency } = require('../utils/currencyConverter');

const getPendingRequests = async (req, res) => {
  // Fallback ID for testing bypass
  const managerId = req.user?.id || "64f0a639-c92e-4b07-9c6a-cc139da5c6c8"; 
  const COMPANY_BASE_CURRENCY = "INR"; 

  try {
    // 1. Fetch all pending requests for this manager
    const allPending = await prisma.approvalRequest.findMany({
      where: {
        approverId: managerId,
        status: 'PENDING'
      },
      include: { 
        expense: { 
          include: { employee: true } 
        } 
      }
    });

    // 2. Filter locally to only show requests where it's actually this manager's turn
    const currentTurnRequests = allPending.filter(request => 
      request.expense.currentStep === request.sequenceOrder
    );

    // 3. Convert currency for the items that passed the filter
    const enrichedRequests = await Promise.all(currentTurnRequests.map(async (request) => {
      const convertedValue = await convertCurrency(
        request.expense.submittedAmount, 
        request.expense.submittedCurrency, 
        COMPANY_BASE_CURRENCY
      );
      
      return {
        ...request,
        calculatedBaseAmount: Number(convertedValue).toFixed(2),
        baseCurrency: COMPANY_BASE_CURRENCY
      };
    }));

    res.json(enrichedRequests);
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
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

    // Update the specific approval record
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status, comments, actionedAt: new Date() }
    });

    // Handle Rejection
    if (status === 'REJECTED') {
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { status: 'REJECTED' }
      });
      return res.json({ message: "Expense Rejected." });
    }

    // Handle Approval: Check for next person in line
    const nextRequest = await prisma.approvalRequest.findFirst({
      where: {
        expenseId: request.expenseId,
        sequenceOrder: request.sequenceOrder + 1
      }
    });

    if (nextRequest) {
      // Move to next step
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { currentStep: request.sequenceOrder + 1 }
      });
      res.json({ message: "Approved. Moved to next step." });
    } else {
      // No more steps - Final Approval
      await prisma.expense.update({
        where: { id: request.expenseId },
        data: { status: 'APPROVED' } 
      });
      res.json({ message: "Expense Fully Approved." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getPendingRequests, processApproval };