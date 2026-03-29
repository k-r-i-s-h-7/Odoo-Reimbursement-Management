const express = require('express');
const router = express.Router();

const authRoutes = require('./AuthRoutes');
const expenseRoutes = require('./ExpenseRoutes');
const adminRoutes = require('./adminRoutes');
const approvalRoutes = require('./ApprovalRoutes');
const managerRoutes = require('./managerRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/admin', adminRoutes);
router.use('/approvals', approvalRoutes);
router.use('/manager', managerRoutes);

module.exports = router;
