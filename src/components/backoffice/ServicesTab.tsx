import { useEffect, useState } from 'react';
import { Plus, Pencil, Search, Sparkles } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import Modal, { Field, inputCls } from './Modal';

interface Service { id: string; name: string; price: number; description: string | null; is_active: boolean; }
const empty = { name: '', price: '', description: '', is_active: true };

const BLUE = '#6AAEC8'; const BLUE_DARK = '#4E96B0'; const ORANGE = '#C47840';

export default function ServicesTab({ currencySymbol }: { currencySymbol: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | 'add' | Service>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase.from('services').select('id,name,price,description,is_active').eq('business_id', BUSINESS_ID).order('name');
    setServices((data ?? []) as Service[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setError(''); setModal('add'); }
  function openEdit(s: Service) { setForm({ name: s.name, price: String(s.price), description: s.description ?? '', is_active: s.is_active }); setError(''); setModal(s); }

  async function save() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name.trim(), price: Number(form.price) || 0, description: form.description || null, is_active: form.is_active, business_id: BUSINESS_ID, company_id: COMPANY_ID };
    if (modal === 'add') {
      const { error: e } = await supabase.from('services').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('services').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', (modal as Service).id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); setModal(null); load();
  }

  const filtered = services.filter(s => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." className={inputCls + ' pl-9'} />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Service</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF0E0' }}>
                  <Sparkles className="w-5 h-5" style={{ color: ORANGE }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-slate-400 truncate">{s.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm" style={{ color: ORANGE }}>{currencySymbol}{Number(s.price).toFixed(2)}</p>
                  <span className={`text-xs font-semibold ${s.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <button onClick={() => openEdit(s)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No services found</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: '#D4EBF5', background: '#F8FBFD' }}>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.description ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: ORANGE }}>{currencySymbol}{Number(s.price).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 transition" onMouseEnter={e => { e.currentTarget.style.background = '#D4EBF5'; e.currentTarget.style.color = '#4E96B0'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No services found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Service' : 'Edit Service'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: '#C47840' }}>{error}</div>}
            <Field label="Name *"><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Price"><input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
            <Field label="Description"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="Status">
              <select className={inputCls} value={String(form.is_active)} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
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
