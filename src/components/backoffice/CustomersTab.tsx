import { useEffect, useState } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import Modal, { Field, inputCls } from './Modal';

interface Customer { id: string; first_name: string; last_name: string; phone: string | null; email: string | null; number_of_buys: number; loyalty_points: number; }
const empty = { first_name: '', last_name: '', phone: '', email: '' };

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

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 text-slate-500 text-left">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium text-right">Purchases</th>
            <th className="px-4 py-3 font-medium text-right">Points</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-right text-slate-700">{c.number_of_buys}</td>
                <td className="px-4 py-3 text-right text-indigo-600 font-medium">{c.loyalty_points}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No customers found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Customer' : 'Edit Customer'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="bg-rose-50 text-rose-600 text-sm px-3 py-2 rounded-xl">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name *"><input className={inputCls} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></Field>
              <Field label="Last Name"><input className={inputCls} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></Field>
            </div>
            <Field label="Phone"><input type="tel" className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
