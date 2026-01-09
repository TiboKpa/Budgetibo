import React from 'react';
import '../styles/MonthCard.css';

function MonthCard({ month, monthName, monthNumber, onSelect }) {
  const handleClick = () => {
    onSelect(monthNumber);
  };

  return (
    <div className="month-card" onClick={handleClick}>
      <div className="month-card-header">
        <h3 className="month-name">{monthName}</h3>
        <span className="month-status">En attente</span>
      </div>

      <div className="month-summary">
        <div className="summary-row">
          <span className="summary-label">Revenus</span>
          <span className="summary-value positive">—</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Dépenses</span>
          <span className="summary-value negative">—</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Épargne</span>
          <span className="summary-value">—</span>
        </div>
      </div>

      <div className="month-card-footer">
        <span className="footer-text">Cliquer pour gérer</span>
        <span className="arrow-icon">→</span>
      </div>
    </div>
  );
}

export default MonthCard;
