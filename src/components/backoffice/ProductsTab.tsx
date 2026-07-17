import { useEffect, useState } from 'react';
import { Plus, Pencil, Search, Archive } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal, { Field, inputCls, selectCls } from './Modal';

interface Product {
  id: string; name: string; sku: string; price: number; cost: number;
  status: string; category_id: string | null; reorder_point: number;
  category: { name: string } | null;
}
interface Category { id: string; name: string; }

const BLUE = '#6AAEC8'; const BLUE_DARK = '#4E96B0'; const ORANGE = '#C47840';
const empty = { name: '', sku: '', price: '', cost: '', category_id: '', reorder_point: '0', status: 'active' };

export default function ProductsTab({ currencySymbol, businessId, companyId }: { currencySymbol: string; businessId: string; companyId: string }) {
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
      supabase.from('products').select('id,name,sku,price,cost,status,category_id,reorder_point,category:categories(name)').eq('business_id', businessId).order('name'),
      supabase.from('categories').select('id,name').eq('business_id', businessId).order('name'),
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
    const payload = { name: form.name.trim(), sku: form.sku.trim(), price: Number(form.price) || 0, cost: Number(form.cost) || 0, category_id: form.category_id || null, reorder_point: Number(form.reorder_point) || 0, status: form.status, business_id: businessId, company_id: companyId };
    if (modal === 'add') {
      const { data: newProd, error: e } = await supabase.from('products').insert(payload).select('id').single();
      if (e || !newProd) { setError(e?.message ?? 'Insert failed'); setSaving(false); return; }
      await supabase.from('inventory').insert({ business_id: businessId, company_id: companyId, product_id: newProd.id, quantity: 0 });
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className={inputCls + ' pl-9'} />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition shrink-0" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Product</span>
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
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400" style={{}}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    {p.status === 'active' && (
                      <button onClick={() => archive(p.id)} className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold" style={{ color: ORANGE }}>{currencySymbol}{Number(p.price).toFixed(2)}</span>
                  <span className="text-slate-400">Cost: {currencySymbol}{Number(p.cost).toFixed(2)}</span>
                  {p.category && <span className="text-slate-400">{p.category.name}</span>}
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No products found</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: '#D4EBF5', background: '#F8FBFD' }}>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Cost</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: ORANGE }}>{currencySymbol}{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{currencySymbol}{Number(p.cost).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 transition" onMouseEnter={e => { e.currentTarget.style.background = '#D4EBF5'; e.currentTarget.style.color = '#4E96B0'; }} onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}><Pencil className="w-4 h-4" /></button>
                        {p.status === 'active' && <button onClick={() => archive(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"><Archive className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal !== null && (
        <Modal title={modal === 'add' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: '#C47840' }}>{error}</div>}
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
