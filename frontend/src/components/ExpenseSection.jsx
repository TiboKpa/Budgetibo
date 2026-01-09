import React, { useState, useEffect } from 'react';
import { fixedExpensesAPI, variableExpensesAPI } from '../services/api';
import '../styles/Section.css';

function ExpenseSection({ year, month, initialExpenses, type }) {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ 
    categoryId: 1, 
    label: '', 
    amount: '',
    subcategory: '',
    costMitigation: ''
  });

  useEffect(() => {
    if (initialExpenses) {
      setExpenses(initialExpenses);
    }
  }, [initialExpenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const api = type === 'fixed' ? fixedExpensesAPI : variableExpensesAPI;
      await api.createExpense(year, month, {
        categoryId: parseInt(formData.categoryId),
        label: formData.label,
        amount: parseFloat(formData.amount),
        subcategory: type === 'variable' ? formData.subcategory : undefined,
        costMitigation: type === 'variable' ? parseFloat(formData.costMitigation || 0) : undefined
      });
      setFormData({ categoryId: 1, label: '', amount: '', subcategory: '', costMitigation: '' });
      // Refresh data would go here
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const api = type === 'fixed' ? fixedExpensesAPI : variableExpensesAPI;
      await api.deleteExpense(year, month, expenseId);
      setExpenses(expenses.filter(e => e.id !== expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => {
    const cost = parseFloat(e.amount) || 0;
    const mitigation = parseFloat(e.cost_mitigation || 0);
    return sum + (cost - mitigation);
  }, 0);

  const sectionTitle = type === 'fixed' ? 'Fixed Expenses' : 'Variable Expenses';

  return (
    <section className="section-container">
      <h3>{sectionTitle}</h3>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Category</th>
            {type === 'variable' && <th>Subcategory</th>}
            <th>Description</th>
            <th>Amount</th>
            {type === 'variable' && <th>Mitigation</th>}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td>{expense.category_name}</td>
              {type === 'variable' && <td>{expense.subcategory}</td>}
              <td>{expense.label}</td>
              <td>{expense.amount.toFixed(2)}€</td>
              {type === 'variable' && <td>{(expense.cost_mitigation || 0).toFixed(2)}€</td>}
              <td>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteExpense(expense.id)}
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="add-form">
        <h4>Add {sectionTitle}</h4>
        <form onSubmit={handleAddExpense}>
          <input
            type="text"
            placeholder="Description"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          {type === 'variable' && (
            <>
              <input
                type="text"
                placeholder="Subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
              <input
                type="number"
                placeholder="Cost Mitigation"
                value={formData.costMitigation}
                onChange={(e) => setFormData({ ...formData, costMitigation: e.target.value })}
              />
            </>
          )}
          <button type="submit">Add {sectionTitle}</button>
        </form>
      </div>

      <div className="total-display">
        <strong>Total {sectionTitle}: {totalExpenses.toFixed(2)}€</strong>
      </div>
    </section>
  );
}

export default ExpenseSection;
