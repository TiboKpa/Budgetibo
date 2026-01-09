import React, { useState, useEffect } from 'react';
import { monthsAPI } from '../services/api';
import MonthCard from '../components/MonthCard';
import '../styles/Dashboard.css';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

function Dashboard({ year, onSelectMonth }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        setLoading(true);
        const response = await monthsAPI.getAllMonths(year);
        setMonths(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMonths();
  }, [year]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Aperçu de l'année {year}</h2>
        <p className="subtitle">Gérez vos finances mois par mois</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Revenus annuels</div>
          <div className="stat-value positive">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dépenses annuelles</div>
          <div className="stat-value negative">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Épargne totale</div>
          <div className="stat-value">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Taux d'épargne</div>
          <div className="stat-value">—%</div>
        </div>
      </div>

      <h3 className="months-section-title">Tous les mois</h3>
      <div className="months-grid">
        {months.map((month, index) => (
          <MonthCard 
            key={month.id}
            month={month}
            monthName={MONTH_NAMES[index]}
            monthNumber={index + 1}
            onSelect={onSelectMonth}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
