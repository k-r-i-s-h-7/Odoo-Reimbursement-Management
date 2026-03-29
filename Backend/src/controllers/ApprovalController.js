/**
 * Approval Rules Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/approvals/rules/:userId   → Get rule for a specific user
 * POST   /api/approvals/rules           → Create or update rule for a user
 * DELETE /api/approvals/rules/:ruleId   → Delete a rule
 *
 * POST   /api/approvals/decide          → Approver submits approve/reject decision
 * GET    /api/approvals/pending         → Get all approval requests pending for the authenticated user
 */

const { prisma } = require('../utils/prisma')
const { processApproverDecision } = require('../services/approval.services')

// ─── Get Rule For User ────────────────────────────────────────────────────────
const getRuleForUser = async (req, res, next) => {
  try {
    const { userId } = req.params

    const rule = await prisma.approvalRule.findFirst({
      where: { targetUserId: userId, companyId: req.user.companyId },
      include: {
        steps: {
          orderBy: { sequenceOrder: 'asc' },
          include: { approver: { select: { id: true, name: true, email: true } } },
        },
        customManager: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
      },
    })

    if (!rule) return res.status(404).json({ message: 'No approval rule configured for this user.' })

    res.json(rule)
  } catch (err) {
    next(err)
  }
}

// ─── Upsert Rule ─────────────────────────────────────────────────────────────
/**
 * Creates or replaces the approval rule for a target user.
 *
 * Body:
 * {
 *   targetUserId: string,
 *   description: string,
 *   customManagerId: string | null,
 *   isManagerApprover: boolean,
 *   isSequential: boolean,
 *   minimumPercentage: number,
 *   steps: [
 *     { approverId: string, sequenceOrder: number, isRequired: boolean }
 *   ]
 * }
 */
const upsertRule = async (req, res, next) => {
  try {
    const {
      targetUserId,
      description,
      customManagerId,
      isManagerApprover,
      isSequential,
      minimumPercentage,
      steps = [],
    } = req.body

    if (!targetUserId) {
      return res.status(400).json({ message: 'targetUserId is required.' })
    }

    // Validate target user belongs to this company
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, companyId: req.user.companyId },
    })
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found in this company.' })
    }

    // Validate all approver IDs
    for (const step of steps) {
      const approver = await prisma.user.findFirst({
        where: { id: step.approverId, companyId: req.user.companyId },
      })
      if (!approver) {
        return res.status(400).json({ message: `Approver ID "${step.approverId}" not found in this company.` })
      }
    }

    // Upsert: delete existing rule for this user then recreate
    // This is simpler than merging steps in complex scenarios
    const existingRule = await prisma.approvalRule.findFirst({
      where: { targetUserId, companyId: req.user.companyId },
    })

    let rule

    if (existingRule) {
      // Delete old steps first (cascade would handle it, but being explicit)
      await prisma.approvalRuleStep.deleteMany({ where: { ruleId: existingRule.id } })

      rule = await prisma.approvalRule.update({
        where: { id: existingRule.id },
        data: {
          description,
          customManagerId: customManagerId || null,
          isManagerApprover: Boolean(isManagerApprover),
          isSequential: Boolean(isSequential),
          minimumPercentage: Number(minimumPercentage) || 50,
          steps: {
            create: steps.map((step, idx) => ({
              approverId: step.approverId,
              sequenceOrder: step.sequenceOrder ?? idx + 1,
              isRequired: Boolean(step.isRequired),
            })),
          },
        },
        include: { steps: { orderBy: { sequenceOrder: 'asc' } } },
      })
    } else {
      rule = await prisma.approvalRule.create({
        data: {
          description,
          targetUserId,
          customManagerId: customManagerId || null,
          isManagerApprover: Boolean(isManagerApprover),
          isSequential: Boolean(isSequential),
          minimumPercentage: Number(minimumPercentage) || 50,
          companyId: req.user.companyId,
          steps: {
            create: steps.map((step, idx) => ({
              approverId: step.approverId,
              sequenceOrder: step.sequenceOrder ?? idx + 1,
              isRequired: Boolean(step.isRequired),
            })),
          },
        },
        include: { steps: { orderBy: { sequenceOrder: 'asc' } } },
      })
    }

    res.status(existingRule ? 200 : 201).json({ message: 'Approval rule saved.', rule })
  } catch (err) {
    next(err)
  }
}

// ─── Delete Rule ─────────────────────────────────────────────────────────────
const deleteRule = async (req, res, next) => {
  try {
    const { ruleId } = req.params

    const rule = await prisma.approvalRule.findFirst({
      where: { id: ruleId, companyId: req.user.companyId },
    })
    if (!rule) return res.status(404).json({ message: 'Rule not found.' })

    await prisma.approvalRule.delete({ where: { id: ruleId } })

    res.json({ message: 'Approval rule deleted.' })
  } catch (err) {
    next(err)
  }
}

// ─── Get Pending Approvals For Logged-In User ────────────────────────────────
const getPendingApprovals = async (req, res, next) => {
  try {
    const requests = await prisma.approvalRequest.findMany({
      where: { approverId: req.user.id, status: 'PENDING' },
      include: {
        expense: {
          include: {
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(requests)
  } catch (err) {
    next(err)
  }
}

// ─── Submit Decision ─────────────────────────────────────────────────────────
/**
 * Body: { expenseId: string, decision: 'APPROVED' | 'REJECTED' }
 */
const submitDecision = async (req, res, next) => {
  try {
    const { expenseId, decision } = req.body

    if (!expenseId || !decision) {
      return res.status(400).json({ message: 'expenseId and decision are required.' })
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be APPROVED or REJECTED.' })
    }

    const result = await processApproverDecision({
      expenseId,
      approverId: req.user.id,
      decision,
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { getRuleForUser, upsertRule, deleteRule, getPendingApprovals, submitDecision }