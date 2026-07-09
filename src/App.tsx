import { useEffect, useState } from 'react';
import { supabase, BUSINESS_ID, COMPANY_ID } from './lib/supabase';
import type { Employee, Settings } from './lib/types';
import LoginScreen from './components/LoginScreen';
import PosScreen from './components/PosScreen';
import BackOffice from './components/BackOffice';

async function loadSettings(): Promise<Settings> {
  const { data } = await supabase
    .from('settings')
    .select('store_name, branch_name, currency_symbol, tax_rate')
    .eq('business_id', BUSINESS_ID)
    .eq('company_id', COMPANY_ID)
    .single();
  return (data as Settings | null) ?? {
    store_name: 'Pink Pearl',
    branch_name: 'Main Branch',
    currency_symbol: 'K',
    tax_rate: 0,
  };
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<'pos' | 'backoffice'>('pos');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (user) {
        const emp = buildEmployee(user);
        const s = await loadSettings();
        setEmployee(emp);
        setSettings(s);
      }
      setBooting(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { setEmployee(null); setSettings(null); }
      if (event === 'SIGNED_IN' && session?.user) {
        const emp = buildEmployee(session.user);
        const s = await loadSettings();
        setEmployee(emp);
        setSettings(s);
        recordSessionStart(emp, s.branch_name);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee || !settings) {
    return <LoginScreen />;
  }

  if (view === 'backoffice') {
    return (
      <BackOffice
        employee={employee}
        settings={settings}
        onClose={() => setView('pos')}
      />
    );
  }

  return (
    <PosScreen
      employee={employee}
      settings={settings}
      onLogout={() => supabase.auth.signOut()}
      onOpenBackOffice={employee.role !== 'Cashier' ? () => setView('backoffice') : undefined}
    />
  );
}

async function recordSessionStart(emp: Employee, branchName: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  // Only insert if no session_start event yet today for this branch
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('business_id', BUSINESS_ID)
    .eq('action', 'pos.session_start')
    .gte('created_at', todayStart.toISOString())
    .maybeSingle();
  if (!data) {
    await supabase.from('events').insert({
      business_id: BUSINESS_ID,
      company_id: COMPANY_ID,
      action: 'pos.session_start',
      actor_id: emp.id,
      actor_name: `${emp.first_name} ${emp.last_name}`.trim(),
      actor_role: emp.role,
      detail_json: { branch_name: branchName },
    });
  }
}

function buildEmployee(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Employee {
  const m = user.user_metadata ?? {};
  return {
    id: user.id,
    first_name: (m.first_name as string) || (user.email?.split('@')[0] ?? 'User'),
    last_name: (m.last_name as string) || '',
    role: (m.role as Employee['role']) || 'Admin',
    username: user.email ?? '',
  };
}
