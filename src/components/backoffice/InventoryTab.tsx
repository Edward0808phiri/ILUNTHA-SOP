import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Plus, Minus } from 'lucide-react';
import { supabase, BUSINESS_ID } from '../../lib/supabase';

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

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';

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
      .eq('business_id', BUSINESS_ID);
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
          placeholder="Search products..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition"
          onFocus={e => e.currentTarget.style.borderColor = BLUE}
          onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map(row => {
              const isLow = row.quantity <= (row.products?.reorder_point ?? 0);
              const isOut = row.quantity === 0;
              const isAdjusting = adjusting?.id === row.product_id;
              return (
                <div key={row.product_id} className={`bg-white rounded-2xl p-4 shadow-sm border ${isOut ? 'border-rose-100' : isLow ? 'border-amber-100' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                        <p className="font-semibold text-slate-800 text-sm truncate">{row.products?.name ?? '-'}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-400">{row.products?.sku ?? '-'}</span>
                        {row.products?.category?.name && (
                          <span className="text-xs text-slate-400">· {row.products.category.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xl font-bold tabular-nums ${isOut ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {row.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">reorder at {row.products?.reorder_point ?? 0}</p>
                    </div>
                  </div>

                  {isAdjusting ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => setAdjusting(a => a ? { ...a, qty: Math.max(0, a.qty - 1) } : a)}
                        className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center text-lg font-bold text-slate-800 tabular-nums">{adjusting.qty}</span>
                      <button
                        onClick={() => setAdjusting(a => a ? { ...a, qty: a.qty + 1 } : a)}
                        className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:bg-slate-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => applyAdjust(row.product_id, adjusting.qty)}
                        className="px-4 py-2 text-white text-sm font-semibold rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setAdjusting(null)}
                        className="px-3 py-2 text-slate-400 text-sm rounded-xl bg-slate-50"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdjusting({ id: row.product_id, qty: row.quantity })}
                      className="w-full py-2 text-sm font-semibold rounded-xl mt-1"
                      style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
                    >
                      Adjust Stock
                    </button>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No products found</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-left text-xs uppercase tracking-wider" style={{ background: '#F8FBFD' }}>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  <th className="px-4 py-3 font-semibold text-right">Reorder At</th>
                  <th className="px-4 py-3 font-semibold text-center">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const isLow = row.quantity <= (row.products?.reorder_point ?? 0);
                  return (
                    <tr key={row.product_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                          {row.products?.name ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.products?.sku ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{row.products?.category?.name ?? '-'}</td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${
                        row.quantity === 0 ? 'text-rose-500' : isLow ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {row.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{row.products?.reorder_point ?? 0}</td>
                      <td className="px-4 py-3">
                        {adjusting?.id === row.product_id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setAdjusting(a => a ? { ...a, qty: Math.max(0, a.qty - 1) } : a)}
                              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-semibold text-slate-800 tabular-nums">{adjusting.qty}</span>
                            <button
                              onClick={() => setAdjusting(a => a ? { ...a, qty: a.qty + 1 } : a)}
                              className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => applyAdjust(row.product_id, adjusting.qty)}
                              className="ml-1 px-3 py-1 text-white text-xs rounded-lg transition"
                              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setAdjusting(null)}
                              className="px-2 py-1 text-slate-400 text-xs hover:text-slate-600 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              onClick={() => setAdjusting({ id: row.product_id, qty: row.quantity })}
                              className="px-3 py-1 text-xs rounded-lg transition"
                              style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
                              onMouseEnter={e => e.currentTarget.style.background = '#B8D9EE'}
                              onMouseLeave={e => e.currentTarget.style.background = BLUE_LIGHT}
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
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No products found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
