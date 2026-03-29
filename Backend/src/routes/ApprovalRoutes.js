const express = require('express')
const router = express.Router()
const {
  getRuleForUser,
  upsertRule,
  deleteRule,
  getPendingApprovals,
  submitDecision,
} = require('../controllers/ApprovalController')
const { authenticate, requireRole } = require('../middleware/AuthMiddleware')

// All approval routes require authentication
router.use(authenticate)

// Admin-only: manage approval rules
router.get('/rules/:userId', requireRole('ADMIN'), getRuleForUser)
router.post('/rules', requireRole('ADMIN'), upsertRule)
router.delete('/rules/:ruleId', requireRole('ADMIN'), deleteRule)

// Manager/Employee: view pending and submit decisions
router.get('/pending', getPendingApprovals)
router.post('/decide', submitDecision)

module.exports = router