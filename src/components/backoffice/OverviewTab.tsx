import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import type { Settings } from '../../lib/types';

interface Props { settings: Settings; }

export default function OverviewTab({ settings }: Props) {
  const cs = settings.currency_symbol;
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [salesRes, productsRes, inventoryRes] = await Promise.all([
        supabase.from('sales').select('total').eq('business_id', BUSINESS_ID).eq('status', 'completed').gte('created_at', today.toISOString()),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID).eq('status', 'active'),
        supabase.from('inventory').select('quantity, products(reorder_point)').eq('business_id', BUSINESS_ID),
      ]);
      const revenue = (salesRes.data ?? []).reduce((s: number, r: { total: number }) => s + Number(r.total), 0);
      const salesCount = (salesRes.data ?? []).length;
      const productCount = productsRes.count ?? 0;
      const lowStock = (inventoryRes.data ?? []).filter((i: { quantity: number; products: unknown }) => {
        const p = i.products as { reorder_point?: number } | null;
        return i.quantity <= (p?.reorder_point ?? 0);
      }).length;
      setStats({ revenue, sales: salesCount, products: productCount, lowStock });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Today's Revenue", value: `${cs}${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: "Today's Sales",   value: stats.sales,                        icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active Products', value: stats.products,                     icon: Package,      color: 'text-violet-600 bg-violet-50' },
    { label: 'Low Stock Items', value: stats.lowStock,                     icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  ];

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}
