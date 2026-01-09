import React, { useState } from 'react';
import { monthsAPI } from '../services/api';
import '../styles/Section.css';

function AllocationSection({ year, month, allocation }) {
  const [alloc, setAlloc] = useState(allocation);
  const [showApplyToYear, setShowApplyToYear] = useState(false);

  const handleAllocationChange = (key, value) => {
    setAlloc(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleApplyToMonth = async () => {
    try {
      await monthsAPI.updateAllocation(year, month, alloc);
      alert('Allocation updated for this month');
    } catch (error) {
      console.error('Error updating allocation:', error);
    }
  };

  const handleApplyToYear = async () => {
    try {
      await monthsAPI.applyAllocationToYear(year, alloc);
      alert('Allocation applied to entire year');
      setShowApplyToYear(false);
    } catch (error) {
      console.error('Error applying allocation to year:', error);
    }
  };

  const total = Object.values(alloc).reduce((sum, val) => sum + val, 0);

  return (
    <section className="section-container">
      <h3>Budget Allocation</h3>
      
      <div className="allocation-controls">
        {Object.entries(alloc).map(([key, value]) => (
          <div key={key} className="allocation-row">
            <label htmlFor={`alloc-${key}`}>{key}:</label>
            <input
              id={`alloc-${key}`}
              type="number"
              min="0"
              max="100"
              value={value}
              onChange={(e) => handleAllocationChange(key, e.target.value)}
            />
            <span className="percentage">%</span>
          </div>
        ))}
      </div>

      <div className="allocation-info">
        <p>Total allocation: {total.toFixed(1)}%</p>
        {total !== 100 && <p className="warning">Total must equal 100%</p>}
      </div>

      <div className="allocation-actions">
        <button onClick={handleApplyToMonth} disabled={total !== 100}>
          Apply to This Month
        </button>
        <button onClick={() => setShowApplyToYear(!showApplyToYear)}>
          Apply to Entire Year
        </button>
      </div>

      {showApplyToYear && (
        <div className="confirmation-dialog">
          <p>Apply this allocation to all {month === 12 ? 12 : 12 - month + 1} months?</p>
          <button onClick={handleApplyToYear}>Confirm</button>
          <button onClick={() => setShowApplyToYear(false)}>Cancel</button>
        </div>
      )}
    </section>
  );
}

export default AllocationSection;
