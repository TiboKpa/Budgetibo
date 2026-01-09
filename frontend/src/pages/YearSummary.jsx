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

  if (loading) return <div className="loading">Chargement du bilan...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!summary) return <div className="error">Pas de données pour le bilan</div>;

  return (
    <div className="year-summary-container">
      <h2>Bilan Annuel {year}</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total Revenus</h3>
          <p className="amount positive">{summary.totalRevenues.toFixed(2)}€</p>
        </div>
        <div className="summary-card">
          <h3>Dépenses Fixes</h3>
          <p className="amount negative">{summary.totalFixedExpenses.toFixed(2)}€</p>
        </div>
        <div className="summary-card">
          <h3>Dépenses Variables</h3>
          <p className="amount negative">{summary.totalVariableExpenses.toFixed(2)}€</p>
        </div>
        <div className="summary-card">
          <h3>Total Épargné</h3>
          <p className="amount highlight">
            {(summary.totalRevenues - summary.totalFixedExpenses - summary.totalVariableExpenses).toFixed(2)}€
          </p>
        </div>
      </div>
    </div>
  );
}

export default YearSummary;
