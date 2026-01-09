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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Year {year} Overview</h2>
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
