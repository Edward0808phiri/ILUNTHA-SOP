﻿import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import Modal, { Field, inputCls } from './Modal';

interface Category { id: string; name: string; sort_order: number; }
const empty = { name: '', sort_order: '0' };

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | Category>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('categories').select('id,name,sort_order').eq('business_id', BUSINESS_ID).order('sort_order');
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setError(''); setModal('add'); }
  function openEdit(c: Category) { setForm({ name: c.name, sort_order: String(c.sort_order) }); setError(''); setModal(c); }

  async function save() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    const payload = { name: form.name.trim(), sort_order: Number(form.sort_order) || 0, business_id: BUSINESS_ID, company_id: COMPANY_ID };
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>
      {loading ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-center">Sort Order</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{c.sort_order}</td>
                  <td className="px-4 py-3 flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-pink-50 text-slate-400 hover:text-pink-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No categories yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="bg-rose-50 text-rose-600 text-sm px-3 py-2 rounded-xl">{error}</div>}
            <Field label="Name *"><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
            <Field label="Sort Order"><input type="number" min="0" className={inputCls} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Category?" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-600 mb-4">Products in this category will not be deleted, but they will become uncategorized.</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Cancel</button>
            <button onClick={() => confirmDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

