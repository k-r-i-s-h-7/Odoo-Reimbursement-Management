/**
 * Approval Engine Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all business logic for routing expense approval requests
 * based on the ApprovalRule configuration set by the admin.
 *
 * Business Rules Implemented:
 *  A. Manager-first routing  (isManagerApprover toggle)
 *  B. Required approver      (isRequired checkbox — auto-reject on rejection)
 *  C. Sequential routing     (isSequential toggle)
 *  D. Parallel routing       (all notified at once)
 *  E. Minimum % threshold    (minimumPercentage — combined with Required check)
 */

const { prisma } = require('../utils/prisma')
const { sendApprovalRequestEmail, sendExpenseDecisionEmail } = require('./EmailServices')

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Fetch the full approval rule for a given user (employee), including steps.
 */
const getRuleForUser = async (employeeId, companyId) => {
  return prisma.approvalRule.findFirst({
    where: { targetUserId: employeeId, companyId },
    include: {
      steps: {
        orderBy: { sequenceOrder: 'asc' },
        include: { approver: true },
      },
      customManager: true,
    },
  })
}

/**
 * Notify a single approver by email that an approval request awaits them.
 */
const notifyApprover = async (approvalRequest, expense) => {
  const approver = await prisma.user.findUnique({ where: { id: approvalRequest.approverId } })
  const employee = await prisma.user.findUnique({ where: { id: expense.employeeId } })

  if (!approver || !employee) return

  await sendApprovalRequestEmail({
    to: approver.email,
    approverName: approver.name,
    submitterName: employee.name,
    description: expense.description,
    expenseId: expense.id,
  }).catch((err) => console.error('[EmailError] notifyApprover:', err))
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initiate the approval workflow when an expense is submitted.
 *
 * Steps:
 * 1. Find the applicable rule for this employee
 * 2. Build ordered ApprovalRequest rows based on:
 *    - isManagerApprover  → manager gets sequence order 0 (first)
 *    - isSequential       → steps are notified one-by-one
 *    - parallel           → all steps notified simultaneously
 * 3. Notify the appropriate approvers via email
 */
const initiateApprovalWorkflow = async (expense) => {
  console.log('[ApprovalService] Initiating workflow for expense:', { id: expense.id, employeeId: expense.employeeId })

  const employee = await prisma.user.findUnique({
    where: { id: expense.employeeId },
    include: { role: true },
  })

  console.log('[ApprovalService] Employee found:', { id: employee.id, name: employee.name })

  const rule = await getRuleForUser(expense.employeeId, employee.companyId)

  // No rule configured → auto-approve (or you can change to manual hold)
  if (!rule) {
    console.log('[ApprovalService] ℹ️ No approval rule configured for employee, auto-approving expense')
    await prisma.expense.update({
      where: { id: expense.id },
      data: { status: 'APPROVED' },
    })
    return
  }

  console.log('[ApprovalService] Rule found:', { id: rule.id, description: rule.description })

  // Build the ordered list of approvers
  // Manager (if isManagerApprover) always gets sequenceOrder = 0
  const requestsToCreate = []

  if (rule.isManagerApprover && rule.customManagerId) {
    requestsToCreate.push({
      expenseId: expense.id,
      approverId: rule.customManagerId,
      sequenceOrder: 0,
      status: 'PENDING',
    })
  }

  // Remaining steps — shift sequence by 1 if manager was prepended
  const offset = requestsToCreate.length
  for (const step of rule.steps) {
    // Avoid duplicating the manager if they were also added as a step
    const alreadyAdded = requestsToCreate.some((r) => r.approverId === step.approverId)
    if (alreadyAdded) continue

    requestsToCreate.push({
      expenseId: expense.id,
      approverId: step.approverId,
      sequenceOrder: step.sequenceOrder + offset,
      status: 'PENDING',
    })
  }

  if (requestsToCreate.length === 0) {
    // Nothing to approve
    await prisma.expense.update({ where: { id: expense.id }, data: { status: 'APPROVED' } })
    return
  }

  // Persist all ApprovalRequest rows
  await prisma.approvalRequest.createMany({ data: requestsToCreate })

  // Update expense to WAITING_APPROVAL
  await prisma.expense.update({ where: { id: expense.id }, data: { status: 'WAITING_APPROVAL' } })

  // Notify approvers
  const createdRequests = await prisma.approvalRequest.findMany({
    where: { expenseId: expense.id },
    orderBy: { sequenceOrder: 'asc' },
  })

  if (rule.isSequential) {
    // Sequential: only notify the first (lowest sequenceOrder) approver
    await notifyApprover(createdRequests[0], expense)
  } else {
    // Parallel: notify all at once
    await Promise.all(createdRequests.map((r) => notifyApprover(r, expense)))
  }
}

/**
 * Process an approver's decision (APPROVE or REJECT) for a given expense.
 *
 * Logic:
 * 1. Mark the ApprovalRequest as APPROVED / REJECTED
 * 2. If REJECTED:
 *    a. If the approver is marked "Required" → auto-reject the entire expense
 *    b. Otherwise → evaluate whether remaining approvals can still satisfy thresholds
 * 3. If APPROVED:
 *    a. Sequential → notify next pending approver
 *    b. Check final resolution: all required approved + minimum % met → APPROVE expense
 */
const processApproverDecision = async ({ expenseId, approverId, decision }) => {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { employee: true },
  })

  if (!expense) throw Object.assign(new Error('Expense not found.'), { statusCode: 404 })
  if (expense.status !== 'WAITING_APPROVAL') {
    throw Object.assign(new Error('Expense is not awaiting approval.'), { statusCode: 400 })
  }

  // Update this approver's request
  const updatedRequest = await prisma.approvalRequest.updateMany({
    where: { expenseId, approverId, status: 'PENDING' },
    data: { status: decision, actionedAt: new Date() },
  })

  if (updatedRequest.count === 0) {
    throw Object.assign(new Error('No pending approval request found for this approver.'), { statusCode: 404 })
  }

  // ── Fetch rule to check Required and thresholds ───────────────────────────
  const rule = await getRuleForUser(expense.employeeId, expense.employee.companyId)

  // Fetch all requests for this expense
  const allRequests = await prisma.approvalRequest.findMany({
    where: { expenseId },
    orderBy: { sequenceOrder: 'asc' },
  })

  // ── Check Required + Auto-reject ─────────────────────────────────────────
  if (decision === 'REJECTED') {
    const isRequired = rule?.steps.some(
      (step) => step.approverId === approverId && step.isRequired
    )
    // Manager acting as first approver is implicitly required
    const isManagerApprover = rule?.isManagerApprover && rule?.customManagerId === approverId

    if (isRequired || isManagerApprover) {
      return await finalizeExpense(expense, 'REJECTED')
    }

    // Non-required rejection: check if remaining approvals can still meet threshold
    return await evaluateFinalOutcome(expense, rule, allRequests)
  }

  // ── Approved: check sequential next step ──────────────────────────────────
  if (rule?.isSequential) {
    const nextPending = allRequests.find((r) => r.status === 'PENDING')
    if (nextPending) {
      await notifyApprover(nextPending, expense)
      return { status: 'WAITING_APPROVAL', message: 'Next approver notified.' }
    }
  }

  // ── Evaluate final outcome ────────────────────────────────────────────────
  return await evaluateFinalOutcome(expense, rule, allRequests)
}

/**
 * Evaluate whether the expense can be finalized based on:
 * - All "Required" approvers have approved
 * - Total approvals >= minimumPercentage of total approvers
 */
const evaluateFinalOutcome = async (expense, rule, allRequests) => {
  const totalApprovers = allRequests.length
  const approvedCount = allRequests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = allRequests.filter((r) => r.status === 'REJECTED').length
  const pendingCount = allRequests.filter((r) => r.status === 'PENDING').length

  // Check required approvers
  const requiredApproverIds = (rule?.steps ?? [])
    .filter((step) => step.isRequired)
    .map((step) => step.approverId)

  if (requiredApproverIds.length > 0) {
    const requiredRequests = allRequests.filter((r) => requiredApproverIds.includes(r.approverId))
    const anyRequiredRejected = requiredRequests.some((r) => r.status === 'REJECTED')

    if (anyRequiredRejected) {
      return await finalizeExpense(expense, 'REJECTED')
    }

    const allRequiredApproved = requiredRequests.every((r) => r.status === 'APPROVED')

    // If required approvers haven't all approved yet, keep waiting
    if (!allRequiredApproved && pendingCount > 0) {
      return { status: 'WAITING_APPROVAL', message: 'Awaiting required approvers.' }
    }
  }

  // Check minimum approval percentage
  const minPct = rule?.minimumPercentage ?? 0
  const currentPct = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0

  // If there are still pending approvals and we haven't met the threshold yet, keep waiting
  if (pendingCount > 0 && currentPct < minPct) {
    return { status: 'WAITING_APPROVAL', message: 'Awaiting more approvals.' }
  }

  // Cannot possibly reach minimum (too many rejections)
  const maxPossibleApprovals = approvedCount + pendingCount
  const maxPossiblePct = totalApprovers > 0 ? (maxPossibleApprovals / totalApprovers) * 100 : 0
  if (maxPossiblePct < minPct) {
    return await finalizeExpense(expense, 'REJECTED')
  }

  // If no pending and threshold met → approve
  if (pendingCount === 0 && currentPct >= minPct) {
    return await finalizeExpense(expense, 'APPROVED')
  }

  // Still pending approvals but threshold already met → wait for sequential stragglers or approve now
  if (currentPct >= minPct) {
    if (!rule?.isSequential) {
      return await finalizeExpense(expense, 'APPROVED')
    }
    // Sequential: still waiting for remaining in chain
    return { status: 'WAITING_APPROVAL', message: 'Minimum percentage met; awaiting sequential chain.' }
  }

  return { status: 'WAITING_APPROVAL', message: 'Awaiting more approvals.' }
}

/**
 * Set the final status on the expense and notify the owner.
 */
const finalizeExpense = async (expense, status) => {
  await prisma.expense.update({ where: { id: expense.id }, data: { status } })

  // Notify expense owner
  await sendExpenseDecisionEmail({
    to: expense.employee.email,
    ownerName: expense.employee.name,
    description: expense.description,
    status,
  }).catch((err) => console.error('[EmailError] finalizeExpense:', err))

  return { status, message: `Expense ${status.toLowerCase()}.` }
}

module.exports = {
  getRuleForUser,
  initiateApprovalWorkflow,
  processApproverDecision,
}