const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { convertCurrency } = require('../utils/currencyConverter');
const { extractTotalAmount } = require('../utils/amountExtraction');

const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

const parseDate = (input) => {
  if (!input) return new Date();
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return new Date();
  return value;
};

const mapExpense = (expense) => ({
  id: expense.id,
  employee: expense.employee?.name || '-',
  description: expense.description,
  date: expense.expenseDate,
  category: expense.category,
  paidBy: expense.paidBy,
  remarks: expense.remarks || '-',
  amount: expense.submittedAmount,
  currency: expense.submittedCurrency,
  status: expense.status,
  approvedAmount: expense.status === 'APPROVED' ? expense.baseAmount : null,
});

const getEmployeeInfo = async (employeeId) => {
  return prisma.user.findUnique({
    where: { id: employeeId },
    include: { company: true, role: true },
  });
};

const getEmployeeExpenses = async (req, res) => {
  try {
    const employeeId = req.user?.userId || req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { employeeId },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(expenses.map(mapExpense));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createManualExpense = async (req, res) => {
  try {
    const employeeId = req.user?.userId || req.body.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    const employee = await getEmployeeInfo(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const {
      description,
      expenseDate,
      category,
      paidBy,
      remarks,
      amount,
      submittedCurrency,
      detailedNotes,
      status,
    } = req.body;

    if (!description || !category || !amount || !submittedCurrency) {
      return res.status(400).json({ message: 'description, category, amount and submittedCurrency are required.' });
    }

    const submittedAmount = Number(amount);
    if (!Number.isFinite(submittedAmount) || submittedAmount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number.' });
    }

    const normalizedStatus = status === 'WAITING_APPROVAL' ? 'WAITING_APPROVAL' : 'DRAFT';
    const companyCurrency = employee.company?.baseCurrency || submittedCurrency;
    const baseAmount = await convertCurrency(submittedAmount, submittedCurrency, companyCurrency);

    const expense = await prisma.expense.create({
      data: {
        description,
        expenseDate: parseDate(expenseDate),
        category,
        paidBy: paidBy || employee.name,
        remarks: remarks || null,
        detailedNotes: detailedNotes || null,
        submittedAmount,
        submittedCurrency,
        baseAmount,
        status: normalizedStatus,
        employeeId,
      },
      include: { employee: true },
    });

    return res.status(201).json(mapExpense(expense));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createUploadedExpense = async (req, res) => {
  try {
    const employeeId = req.user?.userId || req.body.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Receipt file is required.' });
    }

    const employee = await getEmployeeInfo(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);
      extractedText = parsed.text || '';
    } else {
      const ocrResult = await Tesseract.recognize(req.file.buffer, 'eng');
      extractedText = ocrResult.data?.text || '';
    }

    const extractedAmount = extractTotalAmount(extractedText);
    if (!extractedAmount) {
      return res.status(422).json({
        message: 'Could not extract total amount from receipt. Please use manual entry.',
      });
    }

    const submittedCurrency = req.body.submittedCurrency || employee.company?.baseCurrency || 'USD';
    const companyCurrency = employee.company?.baseCurrency || submittedCurrency;
    const baseAmount = await convertCurrency(extractedAmount, submittedCurrency, companyCurrency);

    const expense = await prisma.expense.create({
      data: {
        description: req.body.description || 'Uploaded receipt',
        expenseDate: parseDate(req.body.expenseDate),
        category: req.body.category || 'Miscellaneous',
        paidBy: req.body.paidBy || employee.name,
        remarks: req.body.remarks || null,
        detailedNotes: req.body.detailedNotes || null,
        submittedAmount: extractedAmount,
        submittedCurrency,
        baseAmount,
        receiptUrl: req.file.originalname,
        status: 'DRAFT',
        employeeId,
      },
      include: { employee: true },
    });

    return res.status(201).json({
      ...mapExpense(expense),
      extractedAmount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  getEmployeeExpenses,
  createManualExpense,
  createUploadedExpense,
};
