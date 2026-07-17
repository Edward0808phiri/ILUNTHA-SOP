import { useEffect, useState } from 'react';
import { Receipt, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Sale {
  id: string; invoice_number: string; total: number; status: string;
  created_at: string;
  employees: { first_name: string; last_name: string } | null;
  payments: { method: string; amount: number }[];
}
interface Props { currencySymbol: string; businessId: string; }

const BLUE = '#6AAEC8'; const BLUE_DARK = '#4E96B0'; const ORANGE = '#C47840';

const STATUS_COLOR: Record<string, string> = {
  completed:          'bg-emerald-100 text-emerald-700',
  refunded:           'bg-rose-100 text-rose-700',
  voided:             'bg-slate-100 text-slate-500',
  partially_refunded: 'bg-amber-100 text-amber-700',
};

const METHOD_ICON: Record<string, typeof Banknote> = {
  cash:         Banknote,
  card:         CreditCard,
  mobile_money: Smartphone,
};

const METHOD_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  cash:         { bg: '#ECFDF5', color: '#059669', label: 'Cash' },
  card:         { bg: '#EFF6FF', color: '#3B82F6', label: 'Card' },
  mobile_money: { bg: '#FEF0E0', color: '#C47840', label: 'Mobile' },
};

function PaymentBadge({ method }: { method: string }) {
  const Icon = METHOD_ICON[method] ?? Banknote;
  const style = METHOD_STYLE[method] ?? { bg: '#F1F5F9', color: '#64748B', label: method };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: style.bg, color: style.color }}>
      <Icon className="w-3 h-3" />
      {style.label}
    </span>
  );
}

export default function SalesTab({ currencySymbol, businessId }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sales')
      .select('id, invoice_number, total, status, created_at, employees(first_name, last_name), payments(method, amount)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setSales((data ?? []) as unknown as Sale[]); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {sales.map(s => {
          const method = s.payments?.[0]?.method ?? '';
          return (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#D4EBF5' }}>
                    <Receipt className="w-4 h-4" style={{ color: BLUE_DARK }} />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-slate-800 text-sm">{s.invoice_number}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.employees ? `${s.employees.first_name} ${s.employees.last_name}` : 'Unknown'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: ORANGE }}>{currencySymbol}{Number(s.total).toFixed(2)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pl-12">
                <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</p>
                {method && <PaymentBadge method={method} />}
              </div>
            </div>
          );
        })}
        {sales.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No sales yet</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: '#D4EBF5', background: '#F8FBFD' }}>
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Cashier</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold text-right">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-mono text-slate-700 text-xs">{s.invoice_number}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{s.employees ? `${s.employees.first_name} ${s.employees.last_name}` : '-'}</td>
                <td className="px-4 py-3">
                  {s.payments?.[0]?.method ? <PaymentBadge method={s.payments[0].method} /> : <span className="text-slate-300">-</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: ORANGE }}>{currencySymbol}{Number(s.total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[s.status] ?? 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                </td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No sales yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
