import { useEffect, useState } from 'react';
import { supabase, BUSINESS_ID } from '../../lib/supabase';

interface Emp {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  shift_status: string;
  is_active: boolean;
}

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('employees')
      .select('id, first_name, last_name, username, role, shift_status, is_active')
      .eq('business_id', BUSINESS_ID)
      .order('first_name')
      .then(({ data }) => {
        setEmployees((data ?? []) as Emp[]);
        setLoading(false);
      });
  }, []);

  const roleColor: Record<string, string> = {
    Admin: 'bg-indigo-100 text-indigo-700',
    Supervisor: 'bg-violet-100 text-violet-700',
    Cashier: 'bg-slate-100 text-slate-600',
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500 text-left">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Username</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Shift</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(e => (
            <tr key={e.id} className="border-b border-slate-50 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-800">{e.first_name} {e.last_name}</td>
              <td className="px-4 py-3 text-slate-500">{e.username}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[e.role] ?? 'bg-slate-100 text-slate-500'}`}>{e.role}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.shift_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{e.shift_status}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{e.is_active ? 'Active' : 'Inactive'}</span>
              </td>
            </tr>
          ))}
          {employees.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No employees found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
