import React, { useState, useEffect } from 'react';
import { monthsAPI } from '../services/api';
import MonthCard from '../components/MonthCard';
import '../styles/Dashboard.css';

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

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Vue d'ensemble {year}</h2>
        <p className="subtitle">Sélectionnez un mois pour gérer votre budget</p>
      </div>
      <div className="months-grid">
        {months.map((month, index) => (
          <MonthCard 
            key={month.id}
            month={month}
            monthName={monthNames[index]}
            monthNumber={index + 1}
            onSelect={onSelectMonth}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
