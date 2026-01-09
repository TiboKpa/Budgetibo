import React, { useState, useEffect } from 'react';
import { summaryAPI } from '../services/api';
import '../styles/YearSummary.css';

function YearSummary({ year }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await summaryAPI.getYearSummary(year);
        setSummary(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [year]);

  if (loading) return <div className="loading">Loading summary...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!summary) return <div className="error">No summary data</div>;

  return (
    <div className="year-summary-container">
      <h2>Annual Summary {year}</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total Revenues</h3>
          <p className="amount">{summary.totalRevenues.toFixed(2)}€</p>
        </div>
        <div className="summary-card">
          <h3>Fixed Expenses</h3>
          <p className="amount">{summary.totalFixedExpenses.toFixed(2)}€</p>
        </div>
        <div className="summary-card">
          <h3>Variable Expenses</h3>
          <p className="amount">{summary.totalVariableExpenses.toFixed(2)}€</p>
        </div>
      </div>
    </div>
  );
}

export default YearSummary;
