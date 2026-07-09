﻿import { useEffect, useState } from 'react';
import { Plus, Pencil, Search, Archive } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import Modal, { Field, inputCls, selectCls } from './Modal';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  status: string;
  category_id: string | null;
  reorder_point: number;
  category: { name: string } | null;
}

interface Category { id: string; name: string; }

const empty = { name: '', sku: '', price: '', cost: '', category_id: '', reorder_point: '0', status: 'active' };

export default function ProductsTab({ currencySymbol }: { currencySymbol: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | 'add' | Product>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('id,name,sku,price,cost,status,category_id,reorder_point,category:categories(name)').eq('business_id', BUSINESS_ID).order('name'),
      supabase.from('categories').select('id,name').eq('business_id', BUSINESS_ID).order('name'),
    ]);
    setProducts((prodRes.data ?? []) as unknown as Product[]);
    setCategories((catRes.data ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setForm(empty); setError(''); setModal('add'); }
  function openEdit(p: Product) {
    setForm({ name: p.name, sku: p.sku, price: String(p.price), cost: String(p.cost), category_id: p.category_id ?? '', reorder_point: String(p.reorder_point), status: p.status });
    setError(''); setModal(p);
  }

  async function save() {
    if (!form.name.trim() || !form.sku.trim()) { setError('Name and SKU are required.'); return; }
    setSaving(true); setError('');
    const payload = {
      name: form.name.trim(), sku: form.sku.trim(),
      price: Number(form.price) || 0, cost: Number(form.cost) || 0,
      category_id: form.category_id || null, reorder_point: Number(form.reorder_point) || 0,
      status: form.status, business_id: BUSINESS_ID, company_id: COMPANY_ID,
    };
    if (modal === 'add') {
      const { data: newProd, error: e } = await supabase.from('products').insert(payload).select('id').single();
      if (e || !newProd) { setError(e?.message ?? 'Insert failed'); setSaving(false); return; }
      await supabase.from('inventory').insert({ business_id: BUSINESS_ID, company_id: COMPANY_ID, product_id: newProd.id, quantity: 0 });
    } else {
      const { error: e } = await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', (modal as Product).id);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); setModal(null); load();
  }

  async function archive(id: string) {
    await supabase.from('products').update({ status: 'archived' }).eq('id', id);
    load();
  }

  const filtered = products.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-xl hover:bg-pink-700 transition">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-slate-500 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category?.name ?? 'â€”'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{currencySymbol}{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{currencySymbol}{Number(p.cost).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-pink-50 text-slate-400 hover:text-pink-600"><Pencil className="w-4 h-4" /></button>
                    {p.status === 'active' && <button onClick={() => archive(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Archive className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="bg-rose-50 text-rose-600 text-sm px-3 py-2 rounded-xl">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *"><input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="SKU *"><input className={inputCls} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price"><input type="number" min="0" step="0.01" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></Field>
              <Field label="Cost"><input type="number" min="0" step="0.01" className={inputCls} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select className={selectCls} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Reorder Point"><input type="number" min="0" className={inputCls} value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: e.target.value }))} /></Field>
            </div>
            <Field label="Status">
              <select className={selectCls} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-pink-600 text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

