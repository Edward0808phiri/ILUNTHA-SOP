import { useEffect, useState } from 'react';
import { supabase, BUSINESS_ID, COMPANY_ID } from './lib/supabase';
import type { Employee, Settings } from './lib/types';
import LoginScreen from './components/LoginScreen';
import PosScreen from './components/PosScreen';
import BackOffice from './components/BackOffice';

const SESSION_KEY = 'cs_pos_employee';

async function loadSettings(): Promise<Settings> {
  const { data } = await supabase
    .from('settings')
    .select('store_name, branch_name, currency_symbol, tax_rate')
    .eq('business_id', BUSINESS_ID)
    .eq('company_id', COMPANY_ID)
    .single();
  return (data as Settings | null) ?? {
    store_name: 'Clearskin',
    branch_name: 'North Mead',
    currency_symbol: 'K',
    tax_rate: 0,
  };
}

async function recordSessionStart(emp: Employee, branchName: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('audit_logs')
    .select('id')
    .eq('business_id', BUSINESS_ID)
    .eq('action', 'pos.session_start')
    .gte('created_at', todayStart.toISOString())
    .maybeSingle();
  if (!data) {
    await supabase.from('audit_logs').insert({
      business_id: BUSINESS_ID,
      company_id: COMPANY_ID,
      action: 'pos.session_start',
      detail_json: {
        branch_name: branchName,
        actor_name: `${emp.first_name} ${emp.last_name}`.trim(),
        actor_role: emp.role,
      },
    });
  }
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<'pos' | 'backoffice'>('pos');

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const emp: Employee = JSON.parse(saved);
        setEmployee(emp);
        loadSettings().then(setSettings);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setBooting(false);
  }, []);

  async function handleLogin(emp: Employee) {
    const s = await loadSettings();
    localStorage.setItem(SESSION_KEY, JSON.stringify(emp));
    setEmployee(emp);
    setSettings(s);
    recordSessionStart(emp, s.branch_name);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setEmployee(null);
    setSettings(null);
    setView('pos');
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C1C28' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6AAEC8 transparent #6AAEC8 #6AAEC8' }} />
      </div>
    );
  }

  if (!employee || !settings) {
    return <LoginScreen onLogin={handleLogin} />;
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
      onLogout={handleLogout}
      onOpenBackOffice={employee.role !== 'Cashier' ? () => setView('backoffice') : undefined}
    />
  );
}
