import { useEffect, useState } from 'react';
import { Receipt, LogIn, Package, UserPlus, Activity, Banknote, CreditCard, Smartphone, RefreshCw } from 'lucide-react';
import { supabase, BUSINESS_ID } from '../../lib/supabase';

interface SaleRow {
  id: string;
  created_at: string;
  invoice_number: string;
  total: number;
  employees: { first_name: string; last_name: string } | null;
  payments: { method: string }[];
}

interface AuditRow {
  id: string;
  created_at: string;
  action: string;
  detail_json: Record<string, unknown> | null;
}

interface Event {
  id: string;
  kind: 'sale' | 'login' | 'stock' | 'employee' | 'other';
  created_at: string;
  title: string;
  subtitle: string;
  meta?: string;
}

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE    = '#C47840';

const METHOD_ICON: Record<string, typeof Banknote> = {
  cash:         Banknote,
  card:         CreditCard,
  mobile_money: Smartphone,
};

const METHOD_LABEL: Record<string, string> = {
  cash:         'Cash',
  card:         'Card',
  mobile_money: 'Mobile',
};

const ACTION_MAP: Record<string, { kind: Event['kind']; label: string }> = {
  'pos.session_start':  { kind: 'login',    label: 'Logged in' },
  'stock.adjusted':     { kind: 'stock',    label: 'Stock adjusted' },
  'employee.created':   { kind: 'employee', label: 'Employee added' },
  'employee.updated':   { kind: 'employee', label: 'Employee updated' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function KindIcon({ kind }: { kind: Event['kind'] }) {
  const cfg = {
    sale:     { icon: Receipt,   bg: '#ECFDF5', color: '#059669' },
    login:    { icon: LogIn,     bg: BLUE_LIGHT, color: BLUE_DARK },
    stock:    { icon: Package,   bg: '#FEF0E0',  color: ORANGE },
    employee: { icon: UserPlus,  bg: '#F3E8FF',  color: '#7C3AED' },
    other:    { icon: Activity,  bg: '#F1F5F9',  color: '#64748B' },
  }[kind];
  const Icon = cfg.icon;
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
    </div>
  );
}

interface Props { currencySymbol: string; }

export default function EventsTab({ currencySymbol }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [salesRes, auditRes] = await Promise.all([
      supabase
        .from('sales')
        .select('id, created_at, invoice_number, total, employees(first_name, last_name), payments(method)')
        .eq('business_id', BUSINESS_ID)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('audit_logs')
        .select('id, created_at, action, detail_json')
        .eq('business_id', BUSINESS_ID)
        .order('created_at', { ascending: false })
        .limit(60),
    ]);

    const saleEvents: Event[] = ((salesRes.data ?? []) as unknown as SaleRow[]).map(s => {
      const method = s.payments?.[0]?.method ?? '';
      const MethodIcon = METHOD_ICON[method];
      const cashier = s.employees
        ? `${s.employees.first_name} ${s.employees.last_name}`
        : 'Unknown';
      return {
        id: `sale-${s.id}`,
        kind: 'sale',
        created_at: s.created_at,
        title: `Sale ${s.invoice_number}`,
        subtitle: cashier,
        meta: `${currencySymbol}${Number(s.total).toFixed(2)}${method ? ` · ${METHOD_LABEL[method] ?? method}` : ''}`,
      };
    });

    const auditEvents: Event[] = ((auditRes.data ?? []) as AuditRow[]).map(a => {
      const mapped = ACTION_MAP[a.action];
      const detail = a.detail_json ?? {};
      const actor = (detail.actor_name as string) ?? '';
      const label = mapped?.label ?? a.action;
      let subtitle = actor;
      if (a.action === 'pos.session_start' && detail.branch_name) {
        subtitle = `${actor} · ${detail.branch_name as string}`;
      }
      return {
        id: `audit-${a.id}`,
        kind: mapped?.kind ?? 'other',
        created_at: a.created_at,
        title: label,
        subtitle,
        meta: undefined,
      };
    });

    const merged = [...saleEvents, ...auditEvents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);

    setEvents(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium">Last 100 events · newest first</p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
          <Activity className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-400 text-sm">No events yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          {events.map((ev, i) => (
            <div key={ev.id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? 'rounded-t-2xl' : ''} ${i === events.length - 1 ? 'rounded-b-2xl' : ''} hover:bg-slate-50/60 transition`}>
              <KindIcon kind={ev.kind} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                {ev.subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{ev.subtitle}</p>}
              </div>
              <div className="text-right shrink-0">
                {ev.meta && <p className="text-sm font-bold" style={{ color: ORANGE }}>{ev.meta}</p>}
                <p className="text-[11px] text-slate-300 mt-0.5">{timeAgo(ev.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
