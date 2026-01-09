import React, { useState, useEffect } from 'react';
import { useYearSelection } from './hooks/useYearSelection';
import Dashboard from './pages/Dashboard';
import MonthlyView from './pages/MonthlyView';
import YearSummary from './pages/YearSummary';
import './styles/App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const handleNavigateToMonth = (month) => {
    setSelectedMonth(month);
    setCurrentView('monthly');
  };

  const handleNavigateToYearSummary = () => {
    setCurrentView('summary');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Budgetibo</h1>
        </div>
        <div className="header-center">
          <div className="year-navigation">
            <button onClick={() => setSelectedYear(selectedYear - 1)} className="nav-button">Previous Year</button>
            <span className="current-year">{selectedYear}</span>
            <button onClick={() => setSelectedYear(selectedYear + 1)} className="nav-button">Next Year</button>
          </div>
        </div>
        <div className="header-right">
          <nav className="view-navigation">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setCurrentView('summary')}
              className={`nav-link ${currentView === 'summary' ? 'active' : ''}`}
            >
              Annual Summary
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard year={selectedYear} onSelectMonth={handleNavigateToMonth} />
        )}
        {currentView === 'monthly' && (
          <MonthlyView year={selectedYear} month={selectedMonth} onNavigateToDashboard={() => setCurrentView('dashboard')} />
        )}
        {currentView === 'summary' && (
          <YearSummary year={selectedYear} />
        )}
      </main>
    </div>
  );
}

export default App;
