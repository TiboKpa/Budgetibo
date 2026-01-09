import React, { useState } from 'react';
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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h1 className="app-logo">Budgetibo</h1>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-label">NAVIGATION</span>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              Tableau de bord
            </button>
            <button 
              onClick={() => setCurrentView('summary')}
              className={`nav-item ${currentView === 'summary' ? 'active' : ''}`}
            >
              Bilan Annuel
            </button>
          </div>

          <div className="nav-group">
            <span className="nav-label">ANNÉE</span>
            <div className="year-selector">
              <button onClick={() => setSelectedYear(selectedYear - 1)} className="year-btn">←</button>
              <span className="year-display">{selectedYear}</span>
              <button onClick={() => setSelectedYear(selectedYear + 1)} className="year-btn">→</button>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">TK</div>
            <div className="user-info">
              <span className="name">Tibo Kpa</span>
              <span className="role">Pro Member</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
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
