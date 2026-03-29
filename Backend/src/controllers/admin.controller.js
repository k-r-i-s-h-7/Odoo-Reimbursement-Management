/**
 * Admin Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/admin/company-profile   → Get company + admin info
 * GET  /api/admin/users             → List all users in the company
 * POST /api/admin/users             → Create employee or manager
 *                                     (auto-generates password, sends email)
 * PUT  /api/admin/users/:id         → Update user (name, role, managerId)
 * DELETE /api/admin/users/:id       → Delete user
 */

const { prisma } = require('../utils/prisma')
const { hashPassword, generateTempPassword, generateResetToken } = require('../utils/password')
const { sendWelcomeEmail } = require('../services/email.services')
const { resetTokenStore } = require('./auth.controller')

// ─── Company Profile ─────────────────────────────────────────────────────────
const getCompanyProfile = async (req, res, next) => {
  try {
    console.log('[AdminController] Getting company profile for company:', req.user.companyId)

    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
    })

    if (!company) {
      console.log('[AdminController] ⚠️ Company not found:', req.user.companyId)
      return res.status(404).json({ message: 'Company not found.' })
    }

    console.log('[AdminController] ✓ Company profile retrieved:', { id: company.id, name: company.name })

    res.json({
      ...company,
      email: req.user.email,
      adminEmail: req.user.email,
    })
  } catch (err) {
    console.error('[AdminController] ❌ Error getting company profile:', err.message)
    next(err)
  }
}

// ─── List Users ──────────────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    console.log('[AdminController] Listing users for company:', req.user.companyId)

    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    })

    console.log('[AdminController] ✓ Found users:', users.length)

    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        managerId: u.managerId ?? null,
      }))
    )
  } catch (err) {
    console.error('[AdminController] ❌ Error listing users:', err.message)
    next(err)
  }
}

// ─── Create User ─────────────────────────────────────────────────────────────
/**
 * Admin creates an employee or manager.
 * - No password is set by the admin
 * - System generates a secure temp password
 * - A password-reset token is issued
 * - Welcome email sent with temp password + reset link
 */
const createUser = async (req, res, next) => {
  try {
    console.log('[AdminController] Creating user with request body:', req.body)
    
    const { name, email, role: roleName, managerId } = req.body

    if (!name || !email || !roleName) {
      console.log('[AdminController] ⚠️ Missing required fields:', { name: !!name, email: !!email, roleName: !!roleName })
      return res.status(400).json({ message: 'Name, email, and role are required.' })
    }

    const allowedRoles = ['EMPLOYEE', 'MANAGER']
    if (!allowedRoles.includes(roleName)) {
      console.log('[AdminController] ⚠️ Invalid role:', roleName)
      return res.status(400).json({ message: 'Role must be EMPLOYEE or MANAGER.' })
    }

    // Check email uniqueness within company (or globally — emails are unique in schema)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.log('[AdminController] ⚠️ Email already exists:', email)
      return res.status(409).json({ message: 'A user with this email already exists.' })
    }

    // Validate manager exists in the same company (if provided)
    if (managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: managerId, companyId: req.user.companyId },
        include: { role: true },
      })
      if (!manager) {
        console.log('[AdminController] ⚠️ Manager not found:', managerId)
        return res.status(400).json({ message: 'Assigned manager not found in this company.' })
      }
      if (manager.role.name === 'EMPLOYEE') {
        console.log('[AdminController] ⚠️ Manager is not MANAGER or ADMIN role')
        return res.status(400).json({ message: 'Only MANAGER or ADMIN users can be assigned as managers.' })
      }
    }

    // Fetch the role record
    const roleRecord = await prisma.role.findUnique({ where: { name: roleName } })
    if (!roleRecord) {
      console.log('[AdminController] ⚠️ Role not found in database:', roleName)
      return res.status(500).json({ message: `Role "${roleName}" not seeded in database.` })
    }

    console.log('[AdminController] Role record found:', { id: roleRecord.id, name: roleRecord.name })

    // Generate temp password + reset token
    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    const resetToken = generateResetToken()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    console.log('[AdminController] Creating new user in database...', { name, email, roleId: roleRecord.id, companyId: req.user.companyId })

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        companyId: req.user.companyId,
        roleId: roleRecord.id,
        managerId: managerId || null,
      },
      include: { role: true },
    })

    console.log('[AdminController] ✓ User created successfully:', { id: newUser.id, email: newUser.email, role: newUser.role.name })

    // Store reset token (links to the new user)
    resetTokenStore.set(resetToken, { userId: newUser.id, expiresAt })

    // Send welcome email — don't fail the request if email fails
    await sendWelcomeEmail({
      to: newUser.email,
      name: newUser.name,
      tempPassword,
      resetToken,
    }).catch((err) => {
      console.error('[AdminController] ⚠️ Welcome email failed:', err.message)
      console.error('[AdminController] Error details:', {
        code: err.code,
        command: err.command,
      })
    })

    console.log('[AdminController] Sending response with new user data')
    res.status(201).json({
      message: `User created in local mode and reset email queued.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        managerId: newUser.managerId ?? null,
      },
    })
  } catch (err) {
    console.error('[AdminController] ❌ Error creating user:', err.message)
    console.error('[AdminController] Full error:', err)
    next(err)
  }
}

// ─── Update User ─────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, managerId, role: roleName } = req.body

    // Verify user belongs to admin's company
    const user = await prisma.user.findFirst({
      where: { id, companyId: req.user.companyId },
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const updateData = {}
    if (name) updateData.name = name
    if (managerId !== undefined) updateData.managerId = managerId || null

    if (roleName) {
      const roleRecord = await prisma.role.findUnique({ where: { name: roleName } })
      if (!roleRecord) return res.status(400).json({ message: `Invalid role: ${roleName}` })
      updateData.roleId = roleRecord.id
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    })

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role.name,
      managerId: updated.managerId ?? null,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Delete User ─────────────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findFirst({
      where: { id, companyId: req.user.companyId },
    })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    await prisma.user.delete({ where: { id } })

    res.json({ message: 'User deleted successfully.' })
  } catch (err) {
    next(err)
  }
}

// ─── Save Approval Rule ──────────────────────────────────────────────────────
const saveApprovalRule = async (req, res, next) => {
  try {
    const { userId, ruleConfig } = req.body

    console.log('[AdminController] Saving approval rule for user:', userId)

    if (!userId || !ruleConfig) {
      return res.status(400).json({ message: 'userId and ruleConfig are required.' })
    }

    // Verify user exists and belongs to company
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: req.user.companyId },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // Check if approval rule already exists for this user
    let existingRule = await prisma.approvalRule.findFirst({
      where: { 
        targetUserId: userId,
        companyId: req.user.companyId,
      },
    })

    const ruleData = {
      targetUserId: userId,
      companyId: req.user.companyId,
      description: ruleConfig.description || null,
      ruleType: ruleConfig.ruleType || 'percentage',
      isManagerApprover: ruleConfig.isManagerApprover || false,
      isSequential: ruleConfig.approversSequence || false,
      minimumPercentage: parseInt(ruleConfig.minimumApprovalPercentage) || 50,
      specificApproverId: ruleConfig.specificApproverId || null,
      hybridPercentage: parseInt(ruleConfig.hybridPercentage) || 60,
      customManagerId: ruleConfig.approvalManagerId || null,
    }

    let rule
    if (existingRule) {
      // Update existing rule
      rule = await prisma.approvalRule.update({
        where: { id: existingRule.id },
        data: ruleData,
      })
      console.log('[AdminController] ✓ Approval rule updated:', rule.id)
    } else {
      // Create new rule
      rule = await prisma.approvalRule.create({
        data: ruleData,
      })
      console.log('[AdminController] ✓ Approval rule created:', rule.id)
    }

    // Delete existing approval rule steps and add new ones
    await prisma.approvalRuleStep.deleteMany({
      where: { ruleId: rule.id },
    })

    // Add approval steps for each approver
    if (ruleConfig.approverIds && ruleConfig.approverIds.length > 0) {
      const steps = ruleConfig.approverIds.map((approverId, index) => ({
        ruleId: rule.id,
        approverId,
        sequenceOrder: index + 1,
        isRequired: (ruleConfig.requiredApproverIds || []).includes(approverId),
      }))

      await prisma.approvalRuleStep.createMany({
        data: steps,
      })

      console.log('[AdminController] ✓ Created', steps.length, 'approval steps')
    }

    res.json({ 
      message: 'Approval rule saved successfully.',
      rule: {
        id: rule.id,
        ruleType: rule.ruleType,
        minimumPercentage: rule.minimumPercentage,
      }
    })
  } catch (err) {
    console.error('[AdminController] ❌ Error saving approval rule:', err.message)
    next(err)
  }
}

// ─── Get Approval Rule ───────────────────────────────────────────────────────
const getApprovalRule = async (req, res, next) => {
  try {
    const { userId } = req.params

    console.log('[AdminController] Fetching approval rule for user:', userId)

    const rule = await prisma.approvalRule.findFirst({
      where: { 
        targetUserId: userId,
        companyId: req.user.companyId,
      },
      include: {
        steps: {
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        customManager: {
          select: { id: true, name: true },
        },
      },
    })

    if (!rule) {
      console.log('[AdminController] No approval rule found for user:', userId)
      return res.status(404).json({ message: 'No approval rule found for this user.' })
    }

    console.log('[AdminController] ✓ Approval rule fetched:', rule.id)

    res.json({
      id: rule.id,
      ruleType: rule.ruleType,
      minimumPercentage: rule.minimumPercentage,
      specificApproverId: rule.specificApproverId,
      hybridPercentage: rule.hybridPercentage,
      isManagerApprover: rule.isManagerApprover,
      isSequential: rule.isSequential,
      customManagerId: rule.customManagerId,
      customManager: rule.customManager,
      approvers: rule.steps.map(step => ({
        id: step.approverId,
        name: step.approver.name,
        email: step.approver.email,
        isRequired: step.isRequired,
        sequenceOrder: step.sequenceOrder,
      })),
    })
  } catch (err) {
    console.error('[AdminController] ❌ Error fetching approval rule:', err.message)
    next(err)
  }
}

module.exports = { 
  getCompanyProfile, 
  listUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  saveApprovalRule,
  getApprovalRule,
}