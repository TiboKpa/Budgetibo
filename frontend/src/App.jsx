import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MonthlyView from './pages/MonthlyView';
import YearSummary from './pages/YearSummary';
import './styles/App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleNavigateToMonth = (month) => {
    setSelectedMonth(month);
    setCurrentView('monthly');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <h1 className="app-logo">Budgetibo</h1>
          <span className="logo-badge">PRO</span>
        </div>

        <div className="header-center">
          <div className="nav-tabs">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              Vue d'ensemble
            </button>
            <button 
              onClick={() => setCurrentView('summary')}
              className={`nav-tab ${currentView === 'summary' ? 'active' : ''}`}
            >
              Bilan annuel
            </button>
          </div>

          <div className="year-control">
            <button onClick={() => setSelectedYear(y => y - 1)} className="year-btn">‹</button>
            <span className="year-display">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="year-btn">›</button>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-btn">Paramètres</button>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard year={selectedYear} onSelectMonth={handleNavigateToMonth} />
        )}
        {currentView === 'monthly' && selectedMonth && (
          <MonthlyView 
            year={selectedYear} 
            month={selectedMonth} 
            onBack={() => setCurrentView('dashboard')} 
          />
        )}
        {currentView === 'summary' && (
          <YearSummary year={selectedYear} />
        )}
      </main>
    </div>
  );
}

export default App;
