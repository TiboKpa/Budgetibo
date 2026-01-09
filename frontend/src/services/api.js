import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const userId = 1;

const api = axios.create({
  baseURL: API_URL,
  params: { userId }
});

export const monthsAPI = {
  getAllMonths: (year) => api.get(`/months/${year}`),
  getMonthDetails: (year, month) => api.get(`/months/${year}/${month}`),
  updateAllocation: (year, month, allocation) => 
    api.patch(`/months/${year}/${month}/allocation`, { allocation }),
  applyAllocationToYear: (year, allocation) => 
    api.post(`/months/${year}/allocation/apply-all`, { allocation })
};

export const revenuesAPI = {
  getRevenues: (year, month) => api.get(`/revenues/${year}/${month}`),
  createRevenue: (year, month, data) => api.post(`/revenues/${year}/${month}`, data),
  updateRevenue: (year, month, revenueId, data) => 
    api.patch(`/revenues/${year}/${month}/${revenueId}`, data),
  deleteRevenue: (year, month, revenueId) => 
    api.delete(`/revenues/${year}/${month}/${revenueId}`),
  copyFromMonth: (year, month, sourceMonth) => 
    api.post(`/revenues/${year}/${month}/copy-from/${sourceMonth}`)
};

export const fixedExpensesAPI = {
  getExpenses: (year, month) => api.get(`/fixed-expenses/${year}/${month}`),
  createExpense: (year, month, data) => api.post(`/fixed-expenses/${year}/${month}`, data),
  updateExpense: (year, month, expenseId, data) => 
    api.patch(`/fixed-expenses/${year}/${month}/${expenseId}`, data),
  deleteExpense: (year, month, expenseId) => 
    api.delete(`/fixed-expenses/${year}/${month}/${expenseId}`),
  copyFromMonth: (year, month, sourceMonth) => 
    api.post(`/fixed-expenses/${year}/${month}/copy-from/${sourceMonth}`)
};

export const variableExpensesAPI = {
  getExpenses: (year, month) => api.get(`/variable-expenses/${year}/${month}`),
  createExpense: (year, month, data) => api.post(`/variable-expenses/${year}/${month}`, data),
  updateExpense: (year, month, expenseId, data) => 
    api.patch(`/variable-expenses/${year}/${month}/${expenseId}`, data),
  deleteExpense: (year, month, expenseId) => 
    api.delete(`/variable-expenses/${year}/${month}/${expenseId}`)
};

export const savingsAccountsAPI = {
  getAccounts: () => api.get('/savings-accounts'),
  createAccount: (data) => api.post('/savings-accounts', data),
  updateAccount: (accountId, data) => api.patch(`/savings-accounts/${accountId}`, data),
  deleteAccount: (accountId) => api.delete(`/savings-accounts/${accountId}`),
  recordMonthlySavings: (year, month, allocations) => 
    api.post(`/savings-accounts/${year}/${month}/closure`, { allocations })
};

export const summaryAPI = {
  getMonthSummary: (year, month) => api.get(`/summary/month/${year}/${month}`),
  getYearSummary: (year) => api.get(`/summary/year/${year}`)
};
