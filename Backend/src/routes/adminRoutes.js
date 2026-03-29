<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { createUser, getUsers, getCompanyProfile } = require('../controllers/AdminController');
const { authenticate } = require('../middleware/AuthMiddleware');
const { authorize } = require('../middleware/RoleMiddleware');

router.use(authenticate);          // all admin routes require login
router.use(authorize('Admin'));  // all admin routes require Admin role

router.get('/company-profile', getCompanyProfile);
router.get('/users', getUsers);
router.post('/users', createUser);

=======
const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../controllers/AdminController');
const { authenticate } = require('../middleware/AuthMiddleware');
const { authorize } = require('../middleware/RoleMiddleware');

router.use(authenticate);          // all admin routes require login
router.use(authorize('Admin'));  // all admin routes require Admin role

router.get('/users', getUsers);
router.post('/users', createUser);

>>>>>>> 70369e213828d67b18e9229890d946a3c836a3c5
module.exports = router;