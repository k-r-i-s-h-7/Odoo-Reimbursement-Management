const express = require('express')
const router = express.Router()
const {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  submitExpense,
  deleteExpense,
} = require('../controllers/ExpenseController')
const { authenticate } = require('../middleware/AuthMiddleware')

// All expense routes require authentication
router.use(authenticate)

router.get('/', listExpenses)
router.get('/:id', getExpense)
router.post('/', createExpense)
router.put('/:id', updateExpense)
router.post('/:id/submit', submitExpense)
router.delete('/:id', deleteExpense)

module.exports = router