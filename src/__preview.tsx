import { createRoot } from 'react-dom/client';
import './index.css';
import {
  VIZ, ChartCard, Legend, TableToggle, DataTable, GroupedBars, DivergingBars,
  HBars, Donut, money, type GroupPoint,
} from './components/backoffice/charts';
import { useState } from 'react';

const cs = 'K';

// 30 daily buckets, deliberately lumpy: zero days, a spike, and loss days.
const flow: GroupPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 6, 1 + i);
  const inc = i % 7 === 0 ? 0 : Math.round(400 + Math.sin(i / 2) * 260 + (i === 18 ? 1900 : 0));
  const exp = i % 5 === 0 ? Math.round(700 + i * 22) : Math.round(120 + Math.cos(i) * 80);
  return {
    key: String(i),
    label: d.toLocaleDateString([], { day: 'numeric', month: 'short' }),
    full: d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long' }),
    values: [Math.max(0, inc), Math.max(0, exp)],
  };
});

const SERIES = [
  { name: 'Income', color: VIZ.income },
  { name: 'Expenses', color: VIZ.expense },
];

const byCategory = [
  { label: 'Salaries & Wages', value: 4820 },
  { label: 'Stock & Supplies', value: 3110.5 },
  { label: 'Rent / Lease', value: 2400 },
  { label: 'Utilities', value: 940.25 },
  { label: 'Transport', value: 388 },
  { label: 'Repairs & Maintenance', value: 120 },
];

const topItems = [
  { label: 'Hydrating Facial Cleanser 250ml', value: 5210 },
  { label: 'Deep Cleanse Facial', value: 4180 },
  { label: 'Vitamin C Serum', value: 2980.75 },
  { label: 'Full Body Massage', value: 1750 },
  { label: 'Sunscreen SPF 50', value: 990 },
];

const byMethod = [
  { label: 'Cash', value: 12840.5, color: VIZ.income },
  { label: 'Mobile Money', value: 7320, color: VIZ.expense },
  { label: 'Card', value: 3110.25, color: VIZ.aqua },
];

function App() {
  const [flowTable, setFlowTable] = useState(false);
  const income = flow.reduce((s, d) => s + d.values[0], 0);
  const spend = flow.reduce((s, d) => s + d.values[1], 0);

  return (
    <div style={{ background: '#EFF6FA', minHeight: '100vh' }} className="p-4 sm:p-6">
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Income', value: money(cs, income), sub: '148 sales', color: VIZ.income, bg: '#E4F4FA' },
            { label: 'Expenses', value: money(cs, spend), sub: '24 records', color: VIZ.expense, bg: '#FEF0E0' },
            { label: 'Net Profit', value: money(cs, income - spend), sub: 'Surplus', color: VIZ.positive, bg: '#E4F4FA' },
            { label: 'Margin', value: '41.2%', sub: `Avg sale ${money(cs, 96.4)}`, color: VIZ.muted, bg: '#F1F5F9' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="w-9 h-9 rounded-xl mb-2.5" style={{ background: k.bg }} />
              <div className="text-xl font-bold leading-tight" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{k.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{k.sub}</div>
            </div>
          ))}
        </div>

        <ChartCard
          title="Income vs Expenses"
          hint="By day · last 30 days"
          right={<TableToggle on={flowTable} onClick={() => setFlowTable(v => !v)} />}
        >
          {flowTable ? (
            <DataTable
              head={['Day', 'Income', 'Expenses', 'Net']}
              rows={flow.slice(0, 6).map(d => [d.full, money(cs, d.values[0]), money(cs, d.values[1]), money(cs, d.values[0] - d.values[1])])}
            />
          ) : (
            <>
              <GroupedBars data={flow} series={SERIES} currency={cs} />
              <div className="mt-3 pt-3 border-t border-slate-50"><Legend items={SERIES} /></div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Net Profit" hint="Income minus expenses, above and below the zero line">
          <DivergingBars
            data={flow.map(d => ({ key: d.key, label: d.label, full: d.full, value: d.values[0] - d.values[1] }))}
            currency={cs}
          />
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Expenses by Category" hint="Top 6 of 6">
            <HBars data={byCategory} color={VIZ.expense} currency={cs} />
          </ChartCard>
          <ChartCard title="Top Sellers" hint="Revenue by product and service">
            <HBars data={topItems} color={VIZ.income} currency={cs} />
          </ChartCard>
        </div>

        <ChartCard title="Payment Mix" hint="Share of income by payment method">
          <Donut data={byMethod} currency={cs} />
        </ChartCard>

        <ChartCard title="Table view (twin of the chart above)">
          <DataTable
            head={['Day', 'Income', 'Expenses', 'Net']}
            rows={flow.slice(0, 5).map(d => [d.full, money(cs, d.values[0]), money(cs, d.values[1]), money(cs, d.values[0] - d.values[1])])}
          />
        </ChartCard>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
