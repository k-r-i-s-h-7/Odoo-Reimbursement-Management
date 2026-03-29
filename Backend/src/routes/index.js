const express = require('express');
const authRoutes = require('./AuthRoutes');
const adminRoutes = require('./adminRoutes');
const managerRoutes = require('./managerRoutes');
const employeeRoutes = require('./employeeRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);
router.use('/employee', employeeRoutes);

module.exports = router;
