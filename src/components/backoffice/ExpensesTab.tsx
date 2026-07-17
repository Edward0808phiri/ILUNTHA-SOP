import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../lib/types';
import Modal, { Field, inputCls, selectCls } from './Modal';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
  employees: { first_name: string; last_name: string } | null;
}

interface Props {
  currencySymbol: string;
  businessId: string;
  companyId: string;
  currentEmployee: Employee;
}

const CATEGORIES = [
  'Rent / Lease',
  'Utilities',
  'Stock & Supplies',
  'Salaries & Wages',
  'Equipment',
  'Marketing',
  'Transport',
  'Repairs & Maintenance',
  'Other',
];

const BLUE       = '#6AAEC8';
const BLUE_DARK  = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE     = '#C47840';

type Period = 'today' | 'week' | 'month' | 'all';

function startOfDate(period: Period): string | null {
  const now = new Date();
  if (period === 'today')  return now.toISOString().slice(0, 10);
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return null;
}

const emptyForm = () => ({
  category: CATEGORIES[0],
  amount: '',
  description: '',
  expense_date: new Date().toISOString().slice(0, 10),
});

export default function ExpensesTab({ currencySymbol, businessId, companyId, currentEmployee }: Props) {
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<Period>('month');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase
      .from('expenses')
      .select('id, category, amount, description, expense_date, created_at, employees(first_name, last_name)')
      .eq('business_id', businessId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    const from = startOfDate(period);
    if (from) q = q.gte('expense_date', from);

    const { data } = await q;
    setExpenses((data ?? []) as unknown as Expense[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [period]);

  async function save() {
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid amount greater than zero.'); return; }
    setSaving(true); setError('');
    const { error: e } = await supabase.from('expenses').insert({
      business_id: businessId,
      company_id:  companyId,
      category:    form.category,
      amount:      Number(form.amount),
      description: form.description.trim() || null,
      expense_date: form.expense_date,
      recorded_by: currentEmployee.id,
    });
    if (e) { setError(e.message); setSaving(false); return; }
    setSaving(false);
    setModal(false);
    load();
  }

  async function remove(id: string) {
    setDeleting(id);
    await supabase.from('expenses').delete().eq('id', id).eq('business_id', businessId);
    setDeleting(null);
    load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCats[0];

  const isAdmin = currentEmployee.role === 'Admin';

  const PERIOD_LABELS: Record<Period, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden text-xs font-semibold shrink-0">
          {(['today', 'week', 'month', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-2 transition"
              style={period === p ? { background: BLUE, color: 'white' } : { color: '#64748b' }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl transition"
            style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setForm(emptyForm()); setError(''); setModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium mb-1">Total Spent</p>
          <p className="text-2xl font-bold" style={{ color: ORANGE }}>
            {currencySymbol}{total.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-medium mb-1">Top Category</p>
          <p className="text-sm font-bold text-slate-800 leading-tight">{topCategory?.[0] ?? '—'}</p>
          {topCategory && (
            <p className="text-xs font-semibold mt-1" style={{ color: ORANGE }}>
              {currencySymbol}{topCategory[1].toFixed(2)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-400 font-medium mb-2">Breakdown</p>
          {sortedCats.length === 0 ? (
            <p className="text-xs text-slate-300">No data</p>
          ) : (
            <div className="space-y-2">
              {sortedCats.slice(0, 3).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%`, background: BLUE }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-20 truncate shrink-0">{cat}</span>
                  <span className="text-[10px] font-bold text-slate-600 shrink-0">
                    {currencySymbol}{amt.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }}
          />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <TrendingDown className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-400 text-sm">No expenses recorded for this period</p>
          <button
            onClick={() => { setForm(emptyForm()); setError(''); setModal(true); }}
            className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl text-white transition"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
          >
            Add First Expense
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {expenses.map(exp => (
              <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
                    >
                      {exp.category}
                    </span>
                    {exp.description && (
                      <p className="text-sm text-slate-600 mt-1 truncate">{exp.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {exp.expense_date}
                      {exp.employees && ` · ${exp.employees.first_name} ${exp.employees.last_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-base font-bold" style={{ color: ORANGE }}>
                      {currencySymbol}{Number(exp.amount).toFixed(2)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => remove(exp.id)}
                        disabled={deleting === exp.id}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr
                  className="border-b text-slate-500 text-left text-xs uppercase tracking-wider"
                  style={{ borderColor: BLUE_LIGHT, background: '#F8FBFD' }}
                >
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Recorded By</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  {isAdmin && <th className="px-4 py-3 w-10" />}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">{exp.expense_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">
                      {exp.description ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {exp.employees
                        ? `${exp.employees.first_name} ${exp.employees.last_name}`
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: ORANGE }}>
                      {currencySymbol}{Number(exp.amount).toFixed(2)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => remove(exp.id)}
                          disabled={deleting === exp.id}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Expense modal */}
      {modal && (
        <Modal title="Add Expense" onClose={() => setModal(false)}>
          <div className="space-y-3">
            {error && (
              <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: ORANGE }}>
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={form.expense_date}
                  onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                />
              </Field>
              <Field label="Amount *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className={inputCls}
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Category">
              <select
                className={selectCls}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Description (optional)">
              <input
                className={inputCls}
                placeholder="e.g. Monthly rent payment"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
              >
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
