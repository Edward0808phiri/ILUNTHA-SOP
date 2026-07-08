import { useEffect, useState } from 'react';
import { supabase, BUSINESS_ID } from '../../lib/supabase';

interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  employees: { first_name: string; last_name: string } | null;
}

interface Props { currencySymbol: string; }

export default function SalesTab({ currencySymbol }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('sales')
      .select('id, invoice_number, total, status, created_at, employees(first_name, last_name)')
      .eq('business_id', BUSINESS_ID)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setSales((data ?? []) as unknown as Sale[]);
        setLoading(false);
      });
  }, []);

  const statusColor: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700',
    refunded: 'bg-rose-100 text-rose-700',
    voided: 'bg-slate-100 text-slate-500',
    partially_refunded: 'bg-amber-100 text-amber-700',
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500 text-left">
            <th className="px-4 py-3 font-medium">Invoice</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Cashier</th>
            <th className="px-4 py-3 font-medium text-right">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(sale => (
            <tr key={sale.id} className="border-b border-slate-50 last:border-0">
              <td className="px-4 py-3 font-mono text-slate-700">{sale.invoice_number}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(sale.created_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-600">
                {sale.employees ? `${sale.employees.first_name} ${sale.employees.last_name}` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-800">{currencySymbol}{Number(sale.total).toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[sale.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {sale.status}
                </span>
              </td>
            </tr>
          ))}
          {sales.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No sales yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
