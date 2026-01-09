import React, { useState, useEffect } from 'react';
import { revenuesAPI } from '../services/api';
import '../styles/Section.css';

function RevenueSection({ year, month, initialRevenues }) {
  const [revenues, setRevenues] = useState({ fixed: [], variable: [] });
  const [formData, setFormData] = useState({ type: 'fixed', label: '', amount: '', source: '' });

  useEffect(() => {
    if (initialRevenues) {
      const fixed = initialRevenues.filter(r => r.type === 'fixed');
      const variable = initialRevenues.filter(r => r.type === 'variable');
      setRevenues({ fixed, variable });
    }
  }, [initialRevenues]);

  const handleAddRevenue = async (e) => {
    e.preventDefault();
    try {
      const response = await revenuesAPI.createRevenue(year, month, {
        type: formData.type,
        label: formData.label,
        amount: parseFloat(formData.amount),
        source: formData.source
      });
      setFormData({ type: 'fixed', label: '', amount: '', source: '' });
      // Refresh data
      const data = await revenuesAPI.getRevenues(year, month);
      setRevenues(data.data);
    } catch (error) {
      console.error('Error adding revenue:', error);
    }
  };

  const handleDeleteRevenue = async (revenueId) => {
    try {
      await revenuesAPI.deleteRevenue(year, month, revenueId);
      const data = await revenuesAPI.getRevenues(year, month);
      setRevenues(data.data);
    } catch (error) {
      console.error('Error deleting revenue:', error);
    }
  };

  const totalRevenues = [
    ...revenues.fixed,
    ...revenues.variable
  ].reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <section className="section-container">
      <h3>Revenues</h3>
      
      <div className="subsection">
        <h4>Fixed Revenues</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Source</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {revenues.fixed.map(revenue => (
              <tr key={revenue.id}>
                <td>{revenue.label}</td>
                <td>{revenue.source}</td>
                <td>{revenue.amount.toFixed(2)}€</td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteRevenue(revenue.id)}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="subsection">
        <h4>Variable Revenues</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Source</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {revenues.variable.map(revenue => (
              <tr key={revenue.id}>
                <td>{revenue.label}</td>
                <td>{revenue.source}</td>
                <td>{revenue.amount.toFixed(2)}€</td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteRevenue(revenue.id)}
                  >
                    x
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="add-form">
        <h4>Add Revenue</h4>
        <form onSubmit={handleAddRevenue}>
          <select 
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
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
          <input
            type="text"
            placeholder="Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          />
          <button type="submit">Add Revenue</button>
        </form>
      </div>

      <div className="total-display">
        <strong>Total Revenues: {totalRevenues.toFixed(2)}€</strong>
      </div>
    </section>
  );
}

export default RevenueSection;
