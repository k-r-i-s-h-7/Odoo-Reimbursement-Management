const express = require('express')
const router = express.Router()
const { getCompanyProfile, listUsers, createUser, updateUser, deleteUser, saveApprovalRule, getApprovalRule } = require('../controllers/AdminController')
const { authenticate, requireRole } = require('../middleware/AuthMiddleware')

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'))

router.get('/company-profile', getCompanyProfile)

router.get('/users', listUsers)
router.post('/users', createUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

// Approval Rules Endpoints
router.post('/approval-rules', saveApprovalRule)
router.get('/approval-rules/:userId', getApprovalRule)

module.exports = router