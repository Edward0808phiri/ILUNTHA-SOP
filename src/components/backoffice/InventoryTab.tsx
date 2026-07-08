import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Plus, Minus } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';

interface StockRow {
  product_id: string;
  quantity: number;
  products: {
    name: string;
    sku: string;
    reorder_point: number;
    category: { name: string } | null;
  } | null;
}

interface Props { currencySymbol: string; }

export default function InventoryTab({ currencySymbol: _cs }: Props) {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<{ id: string; qty: number } | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('product_id, quantity, products(name, sku, reorder_point, category:categories(name))')
      .eq('business_id', BUSINESS_ID)
      .order('quantity', { ascending: true });
    setRows((data ?? []) as unknown as StockRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function applyAdjust(productId: string, newQty: number) {
    await supabase
      .from('inventory')
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq('product_id', productId)
      .eq('business_id', BUSINESS_ID)
      .eq('company_id', COMPANY_ID);
    setAdjusting(null);
    load();
  }

  const filtered = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.products?.name.toLowerCase().includes(q) || r.products?.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-left">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Reorder At</th>
                <th className="px-4 py-3 font-medium text-center">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const isLow = row.quantity <= (row.products?.reorder_point ?? 0);
                return (
                  <tr key={row.product_id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                      {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      {row.products?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.products?.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.products?.category?.name ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                      {row.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{row.products?.reorder_point ?? 0}</td>
                    <td className="px-4 py-3">
                      {adjusting?.id === row.product_id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setAdjusting(a => a ? { ...a, qty: a.qty - 1 } : a)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-10 text-center font-semibold">{adjusting.qty}</span>
                          <button onClick={() => setAdjusting(a => a ? { ...a, qty: a.qty + 1 } : a)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => applyAdjust(row.product_id, adjusting.qty)} className="ml-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg">Save</button>
                          <button onClick={() => setAdjusting(null)} className="px-2 py-1 text-slate-400 text-xs">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <button
                            onClick={() => setAdjusting({ id: row.product_id, qty: row.quantity })}
                            className="px-3 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition"
                          >
                            Adjust
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
