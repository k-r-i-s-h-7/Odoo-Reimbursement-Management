const express = require('express');
const router = express.Router();
const { getPendingRequests, processApproval } = require('../controllers/managerController');

// UNCOMMENT THESE:
const { authenticate } = require('../middleware/AuthMiddleware'); 
const { authorize } = require('../middleware/RoleMiddleware'); 

const MANAGER_ROLE_ID = '64f0a639-c92e-4b07-9c6a-cc139da5c6c8'; 

// For testing: No middleware on GET
router.get('/pending', getPendingRequests);

// Keep middleware on POST (or comment out both if you want to test the button)
router.post('/action', authenticate, authorize(MANAGER_ROLE_ID), processApproval);

module.exports = router;