import React from 'react';
import '../styles/MonthCard.css';

function MonthCard({ month, monthName, monthNumber, onSelect }) {
  const handleClick = () => {
    onSelect(monthNumber);
  };

  return (
    <div className="month-card" onClick={handleClick}>
      <h3>{monthName}</h3>
      <div className="month-info">
        <p className="small-text">Click to view details</p>
      </div>
    </div>
  );
}

export default MonthCard;
