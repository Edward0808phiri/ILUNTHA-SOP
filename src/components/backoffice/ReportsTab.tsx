import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  VIZ, ChartCard, Legend, TableToggle, DataTable, GroupedBars, DivergingBars,
  HBars, Donut, EmptyPlot, money, type GroupPoint,
} from './charts';

interface Props { currencySymbol: string; businessId: string; }

interface SaleRow {
  total: number;
  created_at: string;
  payments: { method: string; amount: number }[] | null;
  sale_items: { name_snapshot: string; line_total: number; item_type: string }[] | null;
}
interface ExpenseRow { amount: number; category: string; expense_date: string }

const BLUE = '#6AAEC8';
const BLUE_DARK = '#4E96B0';

type Range = '7d' | '30d' | 'month' | '3m' | 'year';

const RANGES: { key: Range; label: string }[] = [
  { key: '7d',    label: '7 Days'  },
  { key: '30d',   label: '30 Days' },
  { key: 'month', label: 'Month'   },
  { key: '3m',    label: '3 Months'},
  { key: 'year',  label: 'Year'    },
];

/** Local YYYY-MM-DD — expenses are stored as plain dates, so buckets must be local too. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function rangeStart(r: Range): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (r === '7d')   { d.setDate(d.getDate() - 6);  return d; }
  if (r === '30d')  { d.setDate(d.getDate() - 29); return d; }
  if (r === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (r === '3m')   { const s = new Date(d.getFullYear(), d.getMonth() - 2, 1); return s; }
  return new Date(d.getFullYear(), 0, 1);
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash', card: 'Card', mobile_money: 'Mobile Money',
};
const PAYMENT_COLOR: Record<string, string> = {
  cash: VIZ.income, card: VIZ.expense, mobile_money: VIZ.aqua,
};

export default function ReportsTab({ currencySymbol: cs, businessId }: Props) {
  const [range, setRange]       = useState<Range>('30d');
  const [sales, setSales]       = useState<SaleRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [flowTable, setFlowTable] = useState(false);
  const [netTable, setNetTable]   = useState(false);

  async function load() {
    setLoading(true);
    const from = rangeStart(range);
    const fromDay = dayKey(from);

    const [salesRes, expRes] = await Promise.all([
      supabase
        .from('sales')
        .select('total, created_at, payments(method, amount), sale_items(name_snapshot, line_total, item_type)')
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: true })
        .limit(3000),
      supabase
        .from('expenses')
        .select('amount, category, expense_date')
        .eq('business_id', businessId)
        .gte('expense_date', fromDay)
        .limit(3000),
    ]);

    setSales((salesRes.data ?? []) as unknown as SaleRow[]);
    setExpenses((expRes.data ?? []) as unknown as ExpenseRow[]);
    setLoading(false);
    setFirstLoad(false);
  }

  useEffect(() => { load(); }, [range]);

  /* --------------------------- derive --------------------------- */

  const monthly = range === '3m' || range === 'year';

  const buckets = useMemo(() => {
    const start = rangeStart(range);
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const out: { key: string; label: string; full: string }[] = [];

    if (monthly) {
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      while (d <= end) {
        out.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString([], { month: 'short' }),
          full: d.toLocaleDateString([], { month: 'long', year: 'numeric' }),
        });
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      const d = new Date(start);
      while (d <= end) {
        out.push({
          key: dayKey(d),
          label: d.toLocaleDateString([], { day: 'numeric', month: 'short' }),
          full: d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long' }),
        });
        d.setDate(d.getDate() + 1);
      }
    }
    return out;
  }, [range, monthly]);

  const bucketOf = (key: string) => (monthly ? key.slice(0, 7) : key);

  const { flow, income, spend, salesCount } = useMemo(() => {
    const inc = new Map<string, number>();
    const exp = new Map<string, number>();

    for (const s of sales) {
      const k = bucketOf(dayKey(new Date(s.created_at)));
      inc.set(k, (inc.get(k) ?? 0) + Number(s.total));
    }
    for (const e of expenses) {
      const k = bucketOf(e.expense_date.slice(0, 10));
      exp.set(k, (exp.get(k) ?? 0) + Number(e.amount));
    }

    const flow: GroupPoint[] = buckets.map(b => ({
      ...b, values: [inc.get(b.key) ?? 0, exp.get(b.key) ?? 0],
    }));

    return {
      flow,
      income: sales.reduce((s, r) => s + Number(r.total), 0),
      spend: expenses.reduce((s, r) => s + Number(r.amount), 0),
      salesCount: sales.length,
    };
  }, [sales, expenses, buckets, monthly]);

  const net = income - spend;
  const margin = income > 0 ? (net / income) * 100 : 0;
  const avgSale = salesCount > 0 ? income / salesCount : 0;

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount));
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const topItems = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales)
      for (const it of s.sale_items ?? [])
        m.set(it.name_snapshot, (m.get(it.name_snapshot) ?? 0) + Number(it.line_total));
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [sales]);

  const byMethod = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales)
      for (const p of s.payments ?? [])
        m.set(p.method, (m.get(p.method) ?? 0) + Number(p.amount));
    return [...m]
      .sort((a, b) => b[1] - a[1])
      .map(([method, value]) => ({
        label: PAYMENT_LABEL[method] ?? method,
        value,
        color: PAYMENT_COLOR[method] ?? VIZ.muted,
      }));
  }, [sales]);

  const SERIES = [
    { name: 'Income',   color: VIZ.income  },
    { name: 'Expenses', color: VIZ.expense },
  ];

  if (firstLoad) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  const periodLabel = RANGES.find(r => r.key === range)?.label ?? '';

  return (
    /* refetch holds the previous render at reduced opacity — no skeleton flash */
    <div className="space-y-4" style={{ opacity: loading ? 0.55 : 1, transition: 'opacity 150ms' }}>

      {/* One filter row, above everything it scopes */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden text-xs font-semibold">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-3 py-2 transition"
              style={range === r.key ? { background: BLUE, color: 'white' } : { color: '#64748b' }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="ml-auto p-2.5 rounded-xl transition"
          style={{ background: '#D4EBF5', color: BLUE_DARK }}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Headline figures — the numbers ARE the chart here */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Income',     value: money(cs, income), sub: `${salesCount} sale${salesCount !== 1 ? 's' : ''}`, icon: TrendingUp,   color: VIZ.income,  bg: '#E4F4FA' },
          { label: 'Expenses',   value: money(cs, spend),  sub: `${expenses.length} record${expenses.length !== 1 ? 's' : ''}`, icon: TrendingDown, color: VIZ.expense, bg: '#FEF0E0' },
          { label: 'Net Profit', value: money(cs, net),    sub: net >= 0 ? 'Surplus' : 'Deficit', icon: Wallet, color: net >= 0 ? VIZ.positive : VIZ.negative, bg: net >= 0 ? '#E4F4FA' : '#FDECEC' },
          { label: 'Margin',     value: `${margin.toFixed(1)}%`, sub: `Avg sale ${money(cs, avgSale)}`, icon: Percent, color: VIZ.muted, bg: '#F1F5F9' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-xl font-bold leading-tight" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</div>
          </div>
        ))}
      </div>

      {/* Income vs Expenses — same unit, ONE axis */}
      <ChartCard
        title="Income vs Expenses"
        hint={`${monthly ? 'By month' : 'By day'} · last ${periodLabel.toLowerCase()}`}
        right={<TableToggle on={flowTable} onClick={() => setFlowTable(v => !v)} />}
      >
        {flowTable ? (
          <DataTable
            head={[monthly ? 'Month' : 'Day', 'Income', 'Expenses', 'Net']}
            rows={flow.map(d => [
              d.full,
              money(cs, d.values[0]),
              money(cs, d.values[1]),
              money(cs, d.values[0] - d.values[1]),
            ])}
          />
        ) : flow.length === 0 ? (
          <EmptyPlot height={220} label="No activity in this period" />
        ) : (
          <>
            <GroupedBars data={flow} series={SERIES} currency={cs} />
            <div className="mt-3 pt-3 border-t border-slate-50">
              <Legend items={SERIES} />
            </div>
          </>
        )}
      </ChartCard>

      {/* Net profit — polarity around zero */}
      <ChartCard
        title="Net Profit"
        hint="Income minus expenses, above and below the zero line"
        right={<TableToggle on={netTable} onClick={() => setNetTable(v => !v)} />}
      >
        {netTable ? (
          <DataTable
            head={[monthly ? 'Month' : 'Day', 'Net']}
            rows={flow.map(d => [d.full, money(cs, d.values[0] - d.values[1])])}
          />
        ) : flow.length === 0 ? (
          <EmptyPlot height={160} label="No activity in this period" />
        ) : (
          <DivergingBars
            data={flow.map(d => ({ key: d.key, label: d.label, full: d.full, value: d.values[0] - d.values[1] }))}
            currency={cs}
          />
        )}
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Expenses by Category" hint={`Top ${Math.min(8, byCategory.length) || ''} of ${byCategory.length}`.replace(' of 0', '')}>
          <HBars data={byCategory} color={VIZ.expense} currency={cs} />
        </ChartCard>

        <ChartCard title="Top Sellers" hint="Revenue by product and service">
          <HBars data={topItems} color={VIZ.income} currency={cs} />
        </ChartCard>
      </div>

      <ChartCard title="Payment Mix" hint="Share of income by payment method">
        <Donut data={byMethod} currency={cs} />
      </ChartCard>
    </div>
  );
}
