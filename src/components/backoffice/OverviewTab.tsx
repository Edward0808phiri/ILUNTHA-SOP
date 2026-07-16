import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Clock, CalendarCheck } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import type { Settings } from '../../lib/types';

interface Props { settings: Settings; }

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE    = '#C47840';

export default function OverviewTab({ settings }: Props) {
  const cs = settings.currency_symbol;
  const [stats, setStats] = useState({ revenue: 0, sales: 0, products: 0, lowStock: 0 });
  const [shiftTime, setShiftTime] = useState<string | null>(null);
  const [shiftOpener, setShiftOpener] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const [salesRes, productsRes, inventoryRes, shiftRes] = await Promise.all([
        supabase.from('sales').select('total').eq('business_id', BUSINESS_ID).eq('status', 'completed').gte('created_at', today.toISOString()),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID).eq('status', 'active'),
        supabase.from('inventory').select('quantity, products(reorder_point)').eq('business_id', BUSINESS_ID),
        supabase.from('audit_logs')
          .select('created_at, detail_json')
          .eq('business_id', BUSINESS_ID)
          .eq('company_id', COMPANY_ID)
          .eq('action', 'pos.session_start')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const revenue = (salesRes.data ?? []).reduce((s: number, r: { total: number }) => s + Number(r.total), 0);
      const salesCount = (salesRes.data ?? []).length;
      const productCount = productsRes.count ?? 0;
      const lowStock = (inventoryRes.data ?? []).filter((i: { quantity: number; products: unknown }) => {
        const p = i.products as { reorder_point?: number } | null;
        return i.quantity <= (p?.reorder_point ?? 0);
      }).length;

      setStats({ revenue, sales: salesCount, products: productCount, lowStock });

      if (shiftRes.data) {
        const t = new Date(shiftRes.data.created_at);
        setShiftTime(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const detail = shiftRes.data.detail_json as { actor_name?: string } | null;
        setShiftOpener(detail?.actor_name ?? null);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  const today = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">

      {/* Shift status banner */}
      {shiftTime ? (
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: BLUE_LIGHT }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: BLUE_DARK }}>Shift opened at {shiftTime}</p>
            <p className="text-xs mt-0.5" style={{ color: `${BLUE_DARK}99` }}>
              {shiftOpener ? `Opened by ${shiftOpener} · ` : ''}{today}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: BLUE, color: 'white' }}>
            <Clock className="w-3 h-3" />
            Open
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 flex items-center gap-4 border-2 border-dashed" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-100">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-700">No shift opened yet today</p>
            <p className="text-xs text-amber-600 mt-0.5">{today}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `${cs}${stats.revenue.toFixed(2)}`, icon: TrendingUp,    bg: '#EDFAF3', iconColor: '#059669' },
          { label: "Today's Sales",   value: stats.sales,                        icon: ShoppingCart,  bg: '#FEF0E0', iconColor: ORANGE    },
          { label: 'Active Products', value: stats.products,                     icon: Package,       bg: BLUE_LIGHT, iconColor: BLUE_DARK },
          { label: 'Low Stock Items', value: stats.lowStock,                     icon: AlertTriangle, bg: '#FFFBEB', iconColor: '#D97706' },
        ].map(({ label, value, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
