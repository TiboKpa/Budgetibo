import React, { useState, useEffect } from 'react';
import { monthsAPI, revenuesAPI, fixedExpensesAPI, variableExpensesAPI } from '../services/api';
import { ArrowLeft, Plus, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../styles/MonthlyView.css';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const COLORS = {
  besoins: '#FF8C42',
  loisirs: '#4C6EF5',
  vacances: '#7C3AED',
  courses: '#0CAF60',
  epargne: '#06B6D4'
};

function MonthlyView({ year, month, onBack }) {
  const [monthData, setMonthData] = useState(null);
  const [revenues, setRevenues] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [variableExpenses, setVariableExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRevenue, setNewRevenue] = useState({ label: '', amount: '', source: '' });
  const [newFixed, setNewFixed] = useState({ label: '', amount: '', source: '' });
  const [newVariable, setNewVariable] = useState({ label: '', amount: '', subcategory: '' });

  useEffect(() => {
    fetchAllData();
  }, [year, month]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [monthRes, revRes, fixedRes, varRes] = await Promise.all([
        monthsAPI.getMonthDetails(year, month),
        revenuesAPI.getRevenues(year, month),
        fixedExpensesAPI.getExpenses(year, month),
        variableExpensesAPI.getExpenses(year, month)
      ]);
      setMonthData(monthRes.data.month);
      setRevenues(revRes.data);
      setFixedExpenses(fixedRes.data);
      setVariableExpenses(varRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRevenue = async (e) => {
    e.preventDefault();
    try {
      await revenuesAPI.createRevenue(year, month, {
        type: 'fixed',
        label: newRevenue.label,
        amount: parseFloat(newRevenue.amount),
        source: newRevenue.source
      });
      setNewRevenue({ label: '', amount: '', source: '' });
      fetchAllData();
    } catch (err) {
      console.error('Error adding revenue:', err);
    }
  };

  const handleAddFixed = async (e) => {
    e.preventDefault();
    try {
      await fixedExpensesAPI.createExpense(year, month, {
        label: newFixed.label,
        amount: parseFloat(newFixed.amount),
        source: newFixed.source
      });
      setNewFixed({ label: '', amount: '', source: '' });
      fetchAllData();
    } catch (err) {
      console.error('Error adding fixed expense:', err);
    }
  };

  const handleAddVariable = async (e) => {
    e.preventDefault();
    try {
      await variableExpensesAPI.createExpense(year, month, {
        label: newVariable.label,
        amount: parseFloat(newVariable.amount),
        subcategory: newVariable.subcategory
      });
      setNewVariable({ label: '', amount: '', subcategory: '' });
      fetchAllData();
    } catch (err) {
      console.error('Error adding variable expense:', err);
    }
  };

  const handleDeleteRevenue = async (id) => {
    try {
      await revenuesAPI.deleteRevenue(year, month, id);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting revenue:', err);
    }
  };

  const handleDeleteFixed = async (id) => {
    try {
      await fixedExpensesAPI.deleteExpense(year, month, id);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting fixed expense:', err);
    }
  };

  const handleDeleteVariable = async (id) => {
    try {
      await variableExpensesAPI.deleteExpense(year, month, id);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting variable expense:', err);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  const totalRevenues = revenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalVariable = variableExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalExpenses = totalFixed + totalVariable;
  const reste = totalRevenues - totalExpenses;

  // Group variable expenses by subcategory for pie chart
  const variableByCategory = {};
  variableExpenses.forEach(exp => {
    const cat = exp.subcategory || 'Autre';
    variableByCategory[cat] = (variableByCategory[cat] || 0) + parseFloat(exp.amount || 0);
  });

  const pieData = Object.entries(variableByCategory).map(([name, value]) => ({
    name,
    value,
    percentage: totalVariable > 0 ? ((value / totalVariable) * 100).toFixed(1) : 0
  }));

  return (
    <div className="monthly-view">
      <div className="monthly-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
          Retour
        </button>
        <h2>{MONTH_NAMES[month - 1]} {year}</h2>
      </div>

      <div className="monthly-content">
        {/* Left Column: Revenues and Fixed Expenses */}
        <div className="monthly-column">
          {/* Revenues Section */}
          <div className="section-card">
            <div className="section-header green">
              <h3>Revenus</h3>
              <span className="total">{totalRevenues.toFixed(2)} €</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Intitulé</th>
                  <th>Source</th>
                  <th className="text-right">Revenus</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {revenues.map(rev => (
                  <tr key={rev.id}>
                    <td>{rev.label}</td>
                    <td>{rev.source || '—'}</td>
                    <td className="text-right amount positive">{parseFloat(rev.amount).toFixed(2)} €</td>
                    <td>
                      <button onClick={() => handleDeleteRevenue(rev.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="add-row">
                  <td>
                    <input
                      type="text"
                      placeholder="Nom"
                      value={newRevenue.label}
                      onChange={(e) => setNewRevenue({ ...newRevenue, label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Source"
                      value={newRevenue.source}
                      onChange={(e) => setNewRevenue({ ...newRevenue, source: e.target.value })}
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newRevenue.amount}
                      onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                    />
                  </td>
                  <td>
                    <button onClick={handleAddRevenue} className="add-btn" disabled={!newRevenue.label || !newRevenue.amount}>
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fixed Expenses Section */}
          <div className="section-card">
            <div className="section-header red">
              <h3>Dépenses Fixes</h3>
              <span className="total">{totalFixed.toFixed(2)} €</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Intitulé</th>
                  <th>Source</th>
                  <th className="text-right">Dépenses</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fixedExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.label}</td>
                    <td>{exp.source || '—'}</td>
                    <td className="text-right amount negative">{parseFloat(exp.amount).toFixed(2)} €</td>
                    <td>
                      <button onClick={() => handleDeleteFixed(exp.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="add-row">
                  <td>
                    <input
                      type="text"
                      placeholder="Nom"
                      value={newFixed.label}
                      onChange={(e) => setNewFixed({ ...newFixed, label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Source"
                      value={newFixed.source}
                      onChange={(e) => setNewFixed({ ...newFixed, source: e.target.value })}
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newFixed.amount}
                      onChange={(e) => setNewFixed({ ...newFixed, amount: e.target.value })}
                    />
                  </td>
                  <td>
                    <button onClick={handleAddFixed} className="add-btn" disabled={!newFixed.label || !newFixed.amount}>
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Variable Expenses and Chart */}
        <div className="monthly-column">
          {/* Variable Expenses Section */}
          <div className="section-card">
            <div className="section-header orange">
              <h3>Dépenses Variables</h3>
              <span className="total">{totalVariable.toFixed(2)} €</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Intitulé</th>
                  <th className="text-right">Dépenses</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variableExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td><span className="category-badge">{exp.subcategory || 'Autre'}</span></td>
                    <td>{exp.label}</td>
                    <td className="text-right amount negative">{parseFloat(exp.amount).toFixed(2)} €</td>
                    <td>
                      <button onClick={() => handleDeleteVariable(exp.id)} className="delete-btn">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="add-row">
                  <td>
                    <select
                      value={newVariable.subcategory}
                      onChange={(e) => setNewVariable({ ...newVariable, subcategory: e.target.value })}
                    >
                      <option value="">Catégorie</option>
                      <option value="Besoins">Besoins</option>
                      <option value="Loisirs">Loisirs</option>
                      <option value="Vacances">Vacances</option>
                      <option value="Courses">Courses</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Nom"
                      value={newVariable.label}
                      onChange={(e) => setNewVariable({ ...newVariable, label: e.target.value })}
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newVariable.amount}
                      onChange={(e) => setNewVariable({ ...newVariable, amount: e.target.value })}
                    />
                  </td>
                  <td>
                    <button onClick={handleAddVariable} className="add-btn" disabled={!newVariable.label || !newVariable.amount}>
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Chart Section */}
          {variableExpenses.length > 0 && (
            <div className="section-card chart-card">
              <div className="section-header blue">
                <h3>
                  <PieChartIcon size={20} />
                  Répartition Variables
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Summary Card */}
          <div className="summary-card">
            <div className="summary-row">
              <span>Total Revenus</span>
              <span className="amount positive">{totalRevenues.toFixed(2)} €</span>
            </div>
            <div className="summary-row">
              <span>Total Dépenses</span>
              <span className="amount negative">{totalExpenses.toFixed(2)} €</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Reste</span>
              <span className={`amount ${reste >= 0 ? 'positive' : 'negative'}`}>
                {reste.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyView;
