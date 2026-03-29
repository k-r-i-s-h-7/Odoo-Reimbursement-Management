/**
 * Expense Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/expenses            → List expenses (own or all for managers/admins)
 * GET    /api/expenses/:id        → Get single expense with approval chain
 * POST   /api/expenses            → Create expense (DRAFT)
 * PUT    /api/expenses/:id        → Update draft expense
 * POST   /api/expenses/:id/submit → Submit expense for approval
 * DELETE /api/expenses/:id        → Delete draft expense
 */

const { prisma } = require('../utils/prisma')
const { initiateApprovalWorkflow } = require('../services/approval.services')

// ─── List Expenses ────────────────────────────────────────────────────────────
const listExpenses = async (req, res, next) => {
  try {
    const roleName = req.user.role.name
    const filter = {}

    if (roleName === 'EMPLOYEE') {
      // Employees see only their own expenses
      filter.employeeId = req.user.id
    } else if (roleName === 'MANAGER') {
      // Managers see expenses of their subordinates + their own
      const subordinates = await prisma.user.findMany({
        where: { managerId: req.user.id },
        select: { id: true },
      })
      const ids = [req.user.id, ...subordinates.map((u) => u.id)]
      filter.employeeId = { in: ids }
    }
    // ADMIN sees all expenses in company
    else {
      const companyUsers = await prisma.user.findMany({
        where: { companyId: req.user.companyId },
        select: { id: true },
      })
      filter.employeeId = { in: companyUsers.map((u) => u.id) }
    }

    const expenses = await prisma.expense.findMany({
      where: filter,
      include: {
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(expenses)
  } catch (err) {
    next(err)
  }
}

// ─── Get Single Expense ───────────────────────────────────────────────────────
const getExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        approvalRequests: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    })

    if (!expense) return res.status(404).json({ message: 'Expense not found.' })

    res.json(expense)
  } catch (err) {
    next(err)
  }
}

// ─── Create Expense (Draft) ───────────────────────────────────────────────────
const createExpense = async (req, res, next) => {
  try {
    const {
      description,
      expenseDate,
      category,
      paidBy,
      remarks,
      detailedNotes,
      submittedAmount,
      submittedCurrency,
      baseAmount,
      receiptUrl,
    } = req.body

    if (!description || !expenseDate || !category || !submittedAmount || !submittedCurrency) {
      return res.status(400).json({ message: 'description, expenseDate, category, submittedAmount, and submittedCurrency are required.' })
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        expenseDate: new Date(expenseDate),
        category,
        paidBy: paidBy || req.user.name,
        remarks,
        detailedNotes,
        submittedAmount: Number(submittedAmount),
        submittedCurrency,
        baseAmount: baseAmount ? Number(baseAmount) : null,
        receiptUrl: receiptUrl || null,
        status: 'DRAFT',
        employeeId: req.user.id,
      },
    })

    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
}

// ─── Update Expense ───────────────────────────────────────────────────────────
const updateExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } })

    if (!expense) return res.status(404).json({ message: 'Expense not found.' })
    if (expense.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this expense.' })
    }
    if (expense.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT expenses can be edited.' })
    }

    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: { ...req.body },
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// ─── Submit Expense For Approval ──────────────────────────────────────────────
const submitExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    })

    if (!expense) return res.status(404).json({ message: 'Expense not found.' })
    if (expense.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to submit this expense.' })
    }
    if (expense.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT expenses can be submitted.' })
    }

    // Kick off the approval workflow
    await initiateApprovalWorkflow(expense)

    const updated = await prisma.expense.findUnique({ where: { id: expense.id } })

    res.json({ message: 'Expense submitted for approval.', expense: updated })
  } catch (err) {
    next(err)
  }
}

// ─── Delete Expense ───────────────────────────────────────────────────────────
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } })

    if (!expense) return res.status(404).json({ message: 'Expense not found.' })
    if (expense.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this expense.' })
    }
    if (expense.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT expenses can be deleted.' })
    }

    await prisma.expense.delete({ where: { id: req.params.id } })

    res.json({ message: 'Expense deleted.' })
  } catch (err) {
    next(err)
  }
}

module.exports = { listExpenses, getExpense, createExpense, updateExpense, submitExpense, deleteExpense }