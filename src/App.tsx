import { useEffect, useState } from 'react';
import { supabase, BUSINESS_ID, COMPANY_ID } from './lib/supabase';
import type { Employee, Settings } from './lib/types';
import LoginScreen from './components/LoginScreen';
import PosScreen from './components/PosScreen';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  async function loadEmployee(userId: string): Promise<Employee | null> {
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, role, auth_user_id')
      .eq('auth_user_id', userId)
      .eq('business_id', BUSINESS_ID)
      .eq('is_active', true)
      .single();
    return data as Employee | null;
  }

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (user) {
        const [emp, s] = await Promise.all([loadEmployee(user.id), loadSettings()]);
        if (emp) { setEmployee(emp); setSettings(s); }
        else await supabase.auth.signOut();
      }
      setBooting(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') { setEmployee(null); setSettings(null); }
      if (event === 'SIGNED_IN' && session?.user) {
        const [emp, s] = await Promise.all([loadEmployee(session.user.id), loadSettings()]);
        if (emp) { setEmployee(emp); setSettings(s); }
        else { await supabase.auth.signOut(); }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!employee || !settings) {
    return <LoginScreen />;
  }

  return (
    <PosScreen
      employee={employee}
      settings={settings}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}
