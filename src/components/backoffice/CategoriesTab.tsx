import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal, { Field, inputCls } from './Modal';

interface Category { id: string; name: string; sort_order: number; }
const empty = { name: '', sort_order: '0' };

const BLUE = '#6AAEC8'; const BLUE_DARK = '#4E96B0';

export default function CategoriesTab({ businessId, companyId }: { businessId: string; companyId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | Category>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('categories').select('id,name,sort_order').eq('business_id', businessId).order('sort_order');
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setError(''); setModal('add'); }
  function openEdit(c: Category) { setForm({ name: c.name, sort_order: String(c.sort_order) }); setError(''); setModal(c); }

  async function save() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name.trim(), sort_order: Number(form.sort_order) || 0, business_id: businessId, company_id: companyId };
    if (modal === 'add') {
      const { error: e } = await supabase.from('categories').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('categories').update(payload).eq('id', (modal as Category).id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); setModal(null); load();
  }

  async function confirmDelete(id: string) {
    await supabase.from('categories').delete().eq('id', id);
    setDeleteConfirm(null); load();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {categories.map(c => (
          <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#D4EBF5' }}>
              <Tag className="w-5 h-5" style={{ color: BLUE_DARK }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-400">Sort order: {c.sort_order}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => setDeleteConfirm(c.id)} className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No categories yet</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: '#D4EBF5', background: '#F8FBFD' }}>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold text-center">Sort Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-semibold text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-center text-slate-500">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 transition" onMouseEnter={e => { e.currentTarget.style.background = '#D4EBF5'; e.currentTarget.style.color = '#4E96B0'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No categories yet</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: '#C47840' }}>{error}</div>}
            <Field label="Name *"><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Sort Order"><input type="number" min="0" className={inputCls} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Category?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-4">Products in this category will become uncategorized — they will not be deleted.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">Cancel</button>
            <button onClick={() => confirmDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
