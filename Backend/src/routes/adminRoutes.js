const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../controllers/AdminController');
const { authenticate } = require('../middleware/AuthMiddleware');
const { authorize } = require('../middleware/RoleMiddleware');

router.use(authenticate);          // all admin routes require login
router.use(authorize('Admin'));  // all admin routes require Admin role

router.get('/users', getUsers);
router.post('/users', createUser);

module.exports = router;