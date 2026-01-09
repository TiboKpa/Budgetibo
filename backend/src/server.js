const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const monthRoutes = require('./routes/months');
const revenueRoutes = require('./routes/revenues');
const fixedExpenseRoutes = require('./routes/fixedExpenses');
const variableExpenseRoutes = require('./routes/variableExpenses');
const savingsAccountRoutes = require('./routes/savingsAccounts');
const summaryRoutes = require('./routes/summary');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/months', monthRoutes);
app.use('/api/revenues', revenueRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/variable-expenses', variableExpenseRoutes);
app.use('/api/savings-accounts', savingsAccountRoutes);
app.use('/api/summary', summaryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Budgetibo API running on port ${PORT}`);
});
