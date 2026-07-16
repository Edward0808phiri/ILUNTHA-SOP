import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, User, Phone, Mail, ShoppingBag, Star } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import Modal, { Field, inputCls } from './Modal';

interface Customer { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; number_of_buys: number; loyalty_points: number; }
const empty = { first_name: '', last_name: '', phone: '', email: '' };

const BLUE = '#6AAEC8'; const BLUE_DARK = '#4E96B0'; const ORANGE = '#C47840';

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | 'add' | Customer>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase.from('customers').select('id,first_name,last_name,phone,email,number_of_buys,loyalty_points').eq('business_id', BUSINESS_ID).eq('is_active', true).order('first_name');
    setCustomers((data ?? []) as Customer[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setError(''); setModal('add'); }
  function openEdit(c: Customer) { setForm({ first_name: c.first_name, last_name: c.last_name, phone: c.phone ?? '', email: c.email ?? '' }); setError(''); setModal(c); }

  async function save() {
    if (!form.first_name.trim()) { setError('First name is required.'); return; }
    setSaving(true); setError('');
    const payload = { first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone || null, email: form.email || null, business_id: BUSINESS_ID, company_id: COMPANY_ID, is_active: true };
    if (modal === 'add') {
      const { error: e } = await supabase.from('customers').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('customers').update(payload).eq('id', (modal as Customer).id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); setModal(null); load();
  }

  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className={inputCls + ' pl-9'} />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Customer</span>
        </button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
                  {c.first_name[0]}{c.last_name?.[0] ?? ''}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{c.first_name} {c.last_name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{c.number_of_buys}</span>
                    <span className="text-xs flex items-center gap-1 font-semibold" style={{ color: ORANGE }}><Star className="w-3 h-3" />{c.loyalty_points} pts</span>
                  </div>
                </div>
              </div>
              <button onClick={() => openEdit(c)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 shrink-0">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2 pl-13">
              {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
              {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No customers found</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: '#D4EBF5', background: '#F8FBFD' }}>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold text-right">Purchases</th>
              <th className="px-4 py-3 font-semibold text-right">Points</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-semibold text-slate-800">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone ?? '-'}</td>
                <td className="px-4 py-3 text-slate-500">{c.email ?? '-'}</td>
                <td className="px-4 py-3 text-right text-slate-700">{c.number_of_buys}</td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: ORANGE }}>{c.loyalty_points}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 transition" onMouseEnter={e => { e.currentTarget.style.background = '#D4EBF5'; e.currentTarget.style.color = '#4E96B0'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No customers found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Customer' : 'Edit Customer'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: '#C47840' }}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *"><input className={inputCls} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></Field>
              <Field label="Last Name"><input className={inputCls} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></Field>
            </div>
            <Field label="Phone"><input type="tel" className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
