const express = require('express');
const {
  upload,
  getEmployeeExpenses,
  createManualExpense,
  createUploadedExpense,
} = require('../controllers/employeeController');
const { authenticate } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/expenses', getEmployeeExpenses);
router.post('/expenses/manual', createManualExpense);
router.post('/expenses/upload', upload.single('receipt'), createUploadedExpense);

module.exports = router;
