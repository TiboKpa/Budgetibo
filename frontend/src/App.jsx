import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Plus, Copy, Trash2, CalendarDays, BarChart3, Wallet, PieChart } from 'lucide-react'

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 h-full flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 flex-shrink-0">
        {Icon ? <Icon className="h-5 w-5 text-brand-600" /> : null}
        <h2 className="font-medium text-slate-900">{title}</h2>
      </div>
      <div className="p-5 flex-grow overflow-auto">{children}</div>
    </div>
  )
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-sm transition border " +
        (active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300")
      }
    >
      {children}
    </button>
  )
}

function Money({ value }) {
  const n = Number(value || 0)
  return (
    <span className={n < 0 ? 'text-rose-600' : 'text-slate-900'}>
      {n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
    </span>
  )
}

function ProgressBar({ label, amount, total, colorClass = "bg-brand-500" }) {
    // Avoid division by zero
    const pct = total > 0 ? Math.min(100, Math.max(0, (amount / total) * 100)) : 0
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500"><Money value={amount} /> / <Money value={total} /></span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}


function TxRow({ tx, onDelete }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
      <div className="col-span-2 text-sm text-slate-600 font-mono">{format(new Date(tx.date), 'dd/MM')}</div>
      <div className="col-span-4 text-sm font-medium text-slate-700">{tx.description || '-'}</div>
      <div className="col-span-2 text-sm text-slate-500">
        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{tx.category_name}</span>
      </div>
      <div className="col-span-2 text-sm text-slate-500 italic">{tx.subcategory_name || ''}</div>
      <div className="col-span-1 text-sm font-medium text-right"><Money value={tx.amount * (tx.type === 'expense' ? -1 : 1)} /></div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={() => onDelete(tx.id)}
          className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="font-semibold text-lg text-slate-800">{title}</div>
          <button className="p-2 rounded-lg hover:bg-slate-200/50 transition-colors text-slate-500" onClick={onClose}>✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function App() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [months, setMonths] = useState([])
  const [activeMonthIdx, setActiveMonthIdx] = useState(new Date().getMonth())
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [subcats, setSubcats] = useState([])

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category_id: '',
    subcategory_name: '',
    type: 'expense',
    is_fixed: false,
    is_mitigation: false,
  })

  const activeMonth = months[activeMonthIdx]

  const monthLabel = (m) => {
    const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    return names[m.month_number - 1]
  }

  const refreshMonths = async (y) => {
    const res = await axios.get(`/api/months/${y}`)
    setMonths(res.data)
  }

  const refreshTx = async (monthId) => {
    const res = await axios.get(`/api/transactions/${monthId}`)
    setTransactions(res.data)
  }

  const refreshCats = async () => {
    const [c, s] = await Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/subcategories'),
    ])
    setCategories(c.data)
    setSubcats(s.data)
    // Set default category if not set
    if (c.data.length > 0 && !form.category_id) {
        setForm(f => ({ ...f, category_id: c.data.find(cat => cat.name === 'Courses')?.id || c.data[0].id }))
    }
  }

  useEffect(() => {
    refreshMonths(year)
    refreshCats()
  }, [year])

  useEffect(() => {
    if (activeMonth?.id) refreshTx(activeMonth.id)
  }, [activeMonth?.id])

  // Advanced Totals & Breakdown
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    
    // Group expenses by category name
    const expensesByCat = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const catName = t.category_name || 'Autre'
        expensesByCat[catName] = (expensesByCat[catName] || 0) + t.amount
    })

    const totalExpenses = Object.values(expensesByCat).reduce((a, b) => a + b, 0)
    const mitigation = transactions.filter(t => t.is_mitigation === 1).reduce((a, t) => a + t.amount, 0)
    const netExpenses = Math.max(0, totalExpenses - mitigation)
    const estSavings = income - netExpenses

    // Targets based on income (45-10-10-10 rule approximation logic)
    // We use the month config (or defaults) to determine target amounts
    const config = activeMonth?.budget_config ? JSON.parse(activeMonth.budget_config) : { Besoins: 45, Courses: 10, Loisirs: 10, Vacances: 10 }
    
    const targets = {
        Besoins: (income * (config.Besoins || 45)) / 100,
        Courses: (income * (config.Courses || 10)) / 100,
        Loisirs: (income * (config.Loisirs || 10)) / 100,
        Vacances: (income * (config.Vacances || 10)) / 100
    }

    return { income, totalExpenses, mitigation, netExpenses, estSavings, expensesByCat, targets }
  }, [transactions, activeMonth])

  const submitTx = async () => {
    if (!activeMonth?.id) return
    const amount = Number(String(form.amount).replace(',', '.'))
    if (!amount || amount <= 0) return

    await axios.post('/api/transactions', {
      ...form,
      amount,
      category_id: Number(form.category_id),
      is_fixed: form.is_fixed ? 1 : 0,
      is_mitigation: form.is_mitigation ? 1 : 0,
      month_id: activeMonth.id,
    })
    setAddOpen(false)
    setForm(f => ({ ...f, description: '', amount: '', subcategory_name: '' }))
    refreshTx(activeMonth.id)
    refreshCats()
  }

  const deleteTx = async (id) => {
    if(!confirm("Supprimer cette transaction ?")) return
    await axios.delete(`/api/transactions/${id}`)
    refreshTx(activeMonth.id)
  }

  const copyFixed = async () => {
    if (!activeMonth?.id) return
    const sourceMonthId = window.prompt('ID du mois source (ex: 1 = Janvier) ?')
    if (!sourceMonthId) return
    const res = await axios.post(`/api/months/${activeMonth.id}/copy-fixed`, { sourceMonthId: Number(sourceMonthId) })
    alert(`Copié: ${res.data.count} lignes fixes`) 
    refreshTx(activeMonth.id)
  }

  const closeMonth = async () => {
    if (!activeMonth?.id) return
    const savings = window.prompt("Montant FINAL de l'épargne réelle (EUR) ?", String(activeMonth.savings_actual || stats.estSavings))
    if (savings === null) return
    const n = Number(String(savings).replace(',', '.'))
    await axios.put(`/api/months/${activeMonth.id}/close`, {
      savings_actual: Number.isFinite(n) ? n : 0,
      savings_distribution: {},
    })
    refreshMonths(year)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20" />
            <div>
              <div className="font-bold text-lg leading-tight tracking-tight text-slate-800">Budgetibo</div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Patrimoine {year}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all text-slate-600" onClick={() => setYear(y => y - 1)}>
              {year - 1}
            </button>
            <span className="px-2 text-sm font-bold text-slate-800">{year}</span>
            <button className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white hover:shadow-sm transition-all text-slate-600" onClick={() => setYear(y => y + 1)}>
              {year + 1}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Month Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-200">
            {months.map((m, idx) => (
              <Pill key={m.id} active={idx === activeMonthIdx} onClick={() => setActiveMonthIdx(idx)}>
                {monthLabel(m)}
              </Pill>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setAddOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all font-medium text-sm"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
            <button
              onClick={copyFixed}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="Copier les dépenses fixes"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={closeMonth}
              className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl border transition-colors font-medium text-sm gap-2 ${activeMonth?.status === 'closed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              title="Clôturer le mois"
            >
              <CalendarDays className="h-4 w-4" /> {activeMonth?.status === 'closed' ? 'Clôturé' : 'Clôturer'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Breakdown */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="Synthèse Mensuelle" icon={Wallet}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-sm text-slate-500 mb-1">Solde théorique (Épargne)</div>
                    <div className="text-2xl font-bold text-slate-900"><Money value={stats.estSavings} /></div>
                    {activeMonth?.status === 'closed' && (
                        <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            ✓ Réel validé: <Money value={activeMonth.savings_actual} />
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Revenus</span>
                        <span className="font-semibold text-emerald-600">+<Money value={stats.income} /></span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Dépenses</span>
                        <span className="font-semibold text-rose-600">-<Money value={stats.totalExpenses} /></span>
                    </div>
                    {stats.mitigation > 0 && (
                        <div className="flex justify-between text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded">
                            <span>dont mitigation (remb.)</span>
                            <span><Money value={stats.mitigation} /></span>
                        </div>
                    )}
                </div>
              </div>
            </Card>

            <Card title="Répartition Budgétaire" icon={PieChart}>
                <div className="space-y-5">
                    <ProgressBar label="Besoins (Fixes/Vie)" amount={stats.expensesByCat['Besoins'] || 0} total={stats.targets.Besoins} colorClass="bg-blue-500" />
                    <ProgressBar label="Courses" amount={stats.expensesByCat['Courses'] || 0} total={stats.targets.Courses} colorClass="bg-amber-400" />
                    <ProgressBar label="Loisirs" amount={stats.expensesByCat['Loisirs'] || 0} total={stats.targets.Loisirs} colorClass="bg-purple-500" />
                    <ProgressBar label="Vacances" amount={stats.expensesByCat['Vacances'] || 0} total={stats.targets.Vacances} colorClass="bg-emerald-400" />
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-center text-slate-400">
                    Basé sur la règle 45-10-10-10
                </div>
            </Card>
          </div>

          {/* Right Column: Transactions List */}
          <div className="lg:col-span-8 h-[600px]">
            <Card title="Transactions" icon={BarChart3}>
              <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100 mb-2">
                <div className="col-span-2 pl-2">Date</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Catégorie</div>
                <div className="col-span-2">Détail</div>
                <div className="col-span-1 text-right">Montant</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="overflow-y-auto h-[calc(100%-40px)] pr-2 space-y-1">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl m-4">
                    <p>Aucune transaction ce mois-ci</p>
                    <button onClick={() => setAddOpen(true)} className="mt-2 text-brand-600 font-medium hover:underline">Commencer à ajouter</button>
                  </div>
                ) : (
                  transactions
                    .slice()
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((tx) => <TxRow key={tx.id} tx={tx} onDelete={deleteTx} />)
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Modal open={addOpen} title="Nouvelle Transaction" onClose={() => setAddOpen(false)}>
        <div className="grid grid-cols-2 gap-5">
          {/* Type Toggle */}
          <div className="col-span-2 flex p-1 bg-slate-100 rounded-xl">
             <button 
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
             >
                Dépense
             </button>
             <button 
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setForm(f => ({ ...f, type: 'income' }))}
             >
                Revenu
             </button>
          </div>

          <label className="text-sm col-span-1">
            <div className="text-slate-600 font-medium mb-1.5">Date</div>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
          </label>

          <label className="text-sm col-span-1">
            <div className="text-slate-600 font-medium mb-1.5">Montant (€)</div>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-mono" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" autoFocus />
          </label>

          <label className="text-sm col-span-2">
            <div className="text-slate-600 font-medium mb-1.5">Description</div>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Auchan, Loyer, Restaurant..." />
          </label>

          <label className="text-sm col-span-1">
            <div className="text-slate-600 font-medium mb-1.5">Catégorie</div>
            <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="text-sm col-span-1">
            <div className="text-slate-600 font-medium mb-1.5">Sous-catégorie</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              list="subcats"
              value={form.subcategory_name}
              onChange={(e) => setForm(f => ({ ...f, subcategory_name: e.target.value }))}
              placeholder="Ex: Voyage Oslo..."
            />
            <datalist id="subcats">
              {subcats
                .filter(s => String(s.category_id) === String(form.category_id))
                .slice(0, 30)
                .map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </label>

          <div className="col-span-2 flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none group">
              <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300" checked={form.is_fixed} onChange={(e) => setForm(f => ({ ...f, is_fixed: e.target.checked }))} />
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Dépense Fixe (récurrente)</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none group">
              <input type="checkbox" className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300" checked={form.is_mitigation} onChange={(e) => setForm(f => ({ ...f, is_mitigation: e.target.checked }))} />
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Mitigation (Remboursement)</span>
            </label>
          </div>

          <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
            <button className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors" onClick={() => setAddOpen(false)}>
              Annuler
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all transform active:scale-95" onClick={submitTx}>
              Ajouter la transaction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
