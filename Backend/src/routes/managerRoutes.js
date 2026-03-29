const express = require('express');
const router = express.Router();
const { getPendingRequests, processApproval } = require('../controllers/managerController');
const { authenticate } = require('../middleware/AuthMiddleware'); 
const { authorize } = require('../middleware/RoleMiddleware'); 

// The live UUID from the Railway DB
const MANAGER_ROLE_ID = '64f0a639-c92e-4b07-9c6a-cc139da5c6c8'; 

router.get('/pending', authenticate, authorize(MANAGER_ROLE_ID), getPendingRequests);
router.post('/action', authenticate, authorize(MANAGER_ROLE_ID), processApproval);

module.exports = router;