import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { Plus, Copy, Trash2, CalendarDays, BarChart3, Wallet } from 'lucide-react'

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        {Icon ? <Icon className="h-5 w-5 text-brand-600" /> : null}
        <h2 className="font-medium text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
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

function TxRow({ tx, onDelete }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b border-slate-100 last:border-b-0">
      <div className="col-span-2 text-sm text-slate-600">{tx.date}</div>
      <div className="col-span-4 text-sm">{tx.description || '-'}</div>
      <div className="col-span-2 text-sm text-slate-600">{tx.category_name || '-'}</div>
      <div className="col-span-2 text-sm text-slate-600">{tx.subcategory_name || '-'}</div>
      <div className="col-span-1 text-sm font-medium text-right"><Money value={tx.amount * (tx.type === 'expense' ? -1 : 1)} /></div>
      <div className="col-span-1 flex justify-end">
        <button
          onClick={() => onDelete(tx.id)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="font-medium">{title}</div>
          <button className="p-2 rounded-lg hover:bg-slate-100" onClick={onClose}>✕</button>
        </div>
        <div className="p-5">{children}</div>
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
    category_id: 6,
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
  }

  useEffect(() => {
    refreshMonths(year)
    refreshCats()
  }, [year])

  useEffect(() => {
    if (activeMonth?.id) refreshTx(activeMonth.id)
  }, [activeMonth?.id])

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
    const mitigation = transactions.filter(t => t.is_mitigation === 1).reduce((a, t) => a + t.amount, 0)
    // mitigation: modeled as income that reduces an expense bucket
    const netExpenses = Math.max(0, expenses - mitigation)
    const estSavings = income - netExpenses
    return { income, expenses, mitigation, netExpenses, estSavings }
  }, [transactions])

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
    await axios.delete(`/api/transactions/${id}`)
    refreshTx(activeMonth.id)
  }

  const copyFixed = async () => {
    if (!activeMonth?.id) return
    const sourceMonthId = window.prompt('ID du mois source (ex: 1) ?\nAstuce: ouvre l’onglet mois voulu puis regarde son id dans l’API /api/months/{year}')
    if (!sourceMonthId) return
    const res = await axios.post(`/api/months/${activeMonth.id}/copy-fixed`, { sourceMonthId: Number(sourceMonthId) })
    alert(`Copié: ${res.data.count} lignes fixes`) 
    refreshTx(activeMonth.id)
  }

  const closeMonth = async () => {
    if (!activeMonth?.id) return
    const savings = window.prompt("Épargne réelle du mois (EUR) ?", String(activeMonth.savings_actual || ''))
    if (savings === null) return
    const n = Number(String(savings).replace(',', '.'))
    await axios.put(`/api/months/${activeMonth.id}/close`, {
      savings_actual: Number.isFinite(n) ? n : 0,
      savings_distribution: {},
    })
    refreshMonths(year)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-400" />
            <div>
              <div className="font-semibold leading-tight">Budgetibo</div>
              <div className="text-xs text-slate-500">Budget & patrimoine — {year}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50" onClick={() => setYear(y => y - 1)}>
              ← {year - 1}
            </button>
            <button className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50" onClick={() => setYear(y => y + 1)}>
              {year + 1} →
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {months.map((m, idx) => (
              <Pill key={m.id} active={idx === activeMonthIdx} onClick={() => setActiveMonthIdx(idx)}>
                {monthLabel(m)}
              </Pill>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
            <button
              onClick={copyFixed}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              title="Copier revenus/dépenses fixes depuis un autre mois"
            >
              <Copy className="h-4 w-4" /> Copier fixes
            </button>
            <button
              onClick={closeMonth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
              title="Clôturer le mois : saisir l’épargne réelle"
            >
              <CalendarDays className="h-4 w-4" /> Clôturer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Synthèse" icon={Wallet}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Revenus</span><span className="font-medium"><Money value={totals.income} /></span></div>
              <div className="flex justify-between"><span className="text-slate-600">Dépenses</span><span className="font-medium"><Money value={-totals.expenses} /></span></div>
              <div className="flex justify-between"><span className="text-slate-600">Mitigation</span><span className="font-medium"><Money value={totals.mitigation} /></span></div>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between"><span className="text-slate-600">Dépenses nettes</span><span className="font-semibold"><Money value={-totals.netExpenses} /></span></div>
              <div className="flex justify-between"><span className="text-slate-600">Épargne estimée</span><span className="font-semibold"><Money value={totals.estSavings} /></span></div>
              <div className="flex justify-between"><span className="text-slate-600">Épargne réelle</span><span className="font-semibold"><Money value={activeMonth?.savings_actual || 0} /></span></div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card title="Transactions du mois" icon={BarChart3}>
              <div className="grid grid-cols-12 gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100">
                <div className="col-span-2">Date</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Catégorie</div>
                <div className="col-span-2">Sous-cat.</div>
                <div className="col-span-1 text-right">Montant</div>
                <div className="col-span-1"></div>
              </div>
              <div className="mt-2">
                {transactions.length === 0 ? (
                  <div className="text-sm text-slate-500 py-10 text-center">Aucune transaction — ajoutez une dépense ou un revenu.</div>
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

      <Modal open={addOpen} title="Ajouter une transaction" onClose={() => setAddOpen(false)}>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <div className="text-slate-600 mb-1">Type</div>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-slate-600 mb-1">Date</div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2" type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
          </label>

          <label className="text-sm col-span-2">
            <div className="text-slate-600 mb-1">Description</div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Carrefour, EDF, Salaire..." />
          </label>

          <label className="text-sm">
            <div className="text-slate-600 mb-1">Montant (€)</div>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Ex: 42,90" />
          </label>

          <label className="text-sm">
            <div className="text-slate-600 mb-1">Catégorie</div>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </label>

          <label className="text-sm col-span-2">
            <div className="text-slate-600 mb-1">Sous-catégorie (autocomplete)</div>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              list="subcats"
              value={form.subcategory_name}
              onChange={(e) => setForm(f => ({ ...f, subcategory_name: e.target.value }))}
              placeholder="Ex: Courses Auchan, Voyage Norvège..."
            />
            <datalist id="subcats">
              {subcats
                .filter(s => String(s.category_id) === String(form.category_id))
                .slice(0, 30)
                .map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </label>

          <div className="col-span-2 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_fixed} onChange={(e) => setForm(f => ({ ...f, is_fixed: e.target.checked }))} />
              Fixe (copiable)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_mitigation} onChange={(e) => setForm(f => ({ ...f, is_mitigation: e.target.checked }))} />
              Mitigation (réduit un coût)
            </label>
          </div>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50" onClick={() => setAddOpen(false)}>
              Annuler
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={submitTx}>
              Ajouter
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
