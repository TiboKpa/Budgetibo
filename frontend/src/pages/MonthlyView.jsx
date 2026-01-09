import React, { useState, useEffect } from 'react';
import { monthsAPI } from '../services/api';
import RevenueSection from '../components/RevenueSection';
import ExpenseSection from '../components/ExpenseSection';
import AllocationSection from '../components/AllocationSection';
import '../styles/MonthlyView.css';

function MonthlyView({ year, month, onNavigateToDashboard }) {
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonthData = async () => {
      try {
        setLoading(true);
        const response = await monthsAPI.getMonthDetails(year, month);
        setMonthData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [year, month]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  if (loading) return <div className="loading">Chargement des données...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!monthData) return <div className="error">Aucune donnée trouvée</div>;

  return (
    <div className="monthly-view-container">
      <div className="monthly-header">
        <button onClick={onNavigateToDashboard} className="back-button">← Retour</button>
        <div className="header-title">
          <h2>{monthNames[month - 1]} {year}</h2>
          <span className="status-badge">En cours</span>
        </div>
      </div>

      <div className="monthly-content">
        <section className="content-section">
          <RevenueSection year={year} month={month} initialRevenues={monthData.revenues} />
        </section>

        <section className="content-section">
          <ExpenseSection year={year} month={month} initialExpenses={monthData.fixedExpenses} type="fixed" />
        </section>

        <section className="content-section">
          <ExpenseSection year={year} month={month} initialExpenses={monthData.variableExpenses} type="variable" />
        </section>

        <section className="content-section">
          <AllocationSection year={year} month={month} allocation={monthData.allocation} />
        </section>
      </div>
    </div>
  );
}

export default MonthlyView;
