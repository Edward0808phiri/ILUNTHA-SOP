import { useEffect, useState } from 'react';
import { UserPlus, KeyRound, ToggleLeft, ToggleRight, X, Eye, EyeOff, LoaderCircle, Pencil } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../../lib/supabase';
import type { Employee } from '../../lib/types';

interface Emp {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
  shift_status: string;
  is_active: boolean;
}

interface Props { currentEmployee: Employee; }

const BLUE = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE = '#C47840';

const ROLE_COLORS: Record<string, string> = {
  Admin:      'bg-blue-100 text-blue-700',
  Supervisor: 'bg-violet-100 text-violet-700',
  Cashier:    'bg-slate-100 text-slate-600',
};

export default function EmployeesTab({ currentEmployee }: Props) {
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [pwTarget, setPwTarget] = useState<Emp | null>(null);
  const [editTarget, setEditTarget] = useState<Emp | null>(null);

  async function load() {
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, username, role, shift_status, is_active')
      .eq('business_id', BUSINESS_ID)
      .order('first_name');
    setEmployees((data ?? []) as Emp[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(emp: Emp) {
    await supabase.from('employees')
      .update({ is_active: !emp.is_active })
      .eq('id', emp.id)
      .eq('business_id', BUSINESS_ID);
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: !e.is_active } : e));
  }

  const isAdmin = currentEmployee.role === 'Admin';

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
    </div>
  );

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, boxShadow: `0 4px 16px rgba(106,174,200,0.35)` }}
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
                  {emp.first_name[0]}{emp.last_name?.[0] ?? ''}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {emp.first_name} {emp.last_name}
                    {emp.id === currentEmployee.id && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>You</span>
                    )}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">@{emp.username}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[emp.role] ?? 'bg-slate-100 text-slate-500'}`}>{emp.role}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                  {emp.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <button
                  onClick={() => setEditTarget(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition bg-slate-50 text-slate-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setPwTarget(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition"
                  style={{ background: BLUE_LIGHT, color: BLUE_DARK }}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Password
                </button>
                {emp.id !== currentEmployee.id && (
                  <button
                    onClick={() => toggleActive(emp)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${emp.is_active ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}
                  >
                    {emp.is_active ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                    {emp.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {employees.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No employees found</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b text-slate-500 text-left text-xs uppercase tracking-wider" style={{ borderColor: BLUE_LIGHT, background: '#F8FBFD' }}>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Shift</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              {isAdmin && <th className="px-4 py-3 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {emp.first_name} {emp.last_name}
                  {emp.id === currentEmployee.id && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>You</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{emp.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[emp.role] ?? 'bg-slate-100 text-slate-500'}`}>{emp.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.shift_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{emp.shift_status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{emp.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(emp)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-50 text-slate-600 hover:bg-slate-100">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setPwTarget(emp)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition" style={{ background: BLUE_LIGHT, color: BLUE_DARK }}>
                        <KeyRound className="w-3 h-3" /> Password
                      </button>
                      {emp.id !== currentEmployee.id && (
                        <button onClick={() => toggleActive(emp)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${emp.is_active ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          {emp.is_active ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
                          {emp.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No employees found</td></tr>}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}

      {editTarget && (
        <EditEmployeeModal
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load(); }}
        />
      )}

      {pwTarget && (
        <ChangePasswordModal
          employee={pwTarget}
          onClose={() => setPwTarget(null)}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', password: '', role: 'Cashier' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error: rpcErr } = await supabase.rpc('pos_create_employee', {
      p_first_name: form.first_name.trim(),
      p_last_name: form.last_name.trim(),
      p_username: form.username.trim(),
      p_password: form.password,
      p_role: form.role,
      p_business_id: BUSINESS_ID,
      p_company_id: COMPANY_ID,
    });
    if (rpcErr) {
      const isDupe = rpcErr.code === '23505' || rpcErr.message?.toLowerCase().includes('unique') || rpcErr.message?.toLowerCase().includes('duplicate');
      setError(isDupe ? `Username "${form.username.trim()}" is already taken. Please try a different username.` : (rpcErr.message || 'Failed to create employee.'));
    }
    else { onCreated(); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(to right, ${BLUE}, ${ORANGE})` }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Add Employee</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: ORANGE }}>{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} required />
            <Field label="Last Name"  value={form.last_name}  onChange={v => setForm(f => ({ ...f, last_name: v }))}  required />
          </div>
          <Field label="Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition"
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition bg-white"
            >
              <option value="Cashier">Cashier</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
          >
            {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditEmployeeModal({ employee, onClose, onSaved }: { employee: Emp; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    first_name: employee.first_name,
    last_name:  employee.last_name,
    username:   employee.username,
    role:       employee.role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim()) { setError('First name is required.'); return; }
    if (!form.username.trim())   { setError('Username is required.'); return; }
    setLoading(true);
    const { error: err } = await supabase
      .from('employees')
      .update({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        username:   form.username.trim().toLowerCase(),
        role:       form.role,
      })
      .eq('id', employee.id)
      .eq('business_id', BUSINESS_ID);
    if (err) { setError(err.message || 'Failed to save changes.'); }
    else { onSaved(); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(to right, ${BLUE}, ${ORANGE})` }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Edit Employee</h2>
            <p className="text-xs text-slate-400 mt-0.5">@{employee.username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: ORANGE }}>{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} required />
            <Field label="Last Name"  value={form.last_name}  onChange={v => setForm(f => ({ ...f, last_name: v }))} />
          </div>
          <Field label="Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required />
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition bg-white"
            >
              <option value="Cashier">Cashier</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ employee, onClose }: { employee: Emp; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)     { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: rpcErr } = await supabase.rpc('pos_change_password', {
      p_employee_id: employee.id,
      p_new_password: password,
      p_business_id: BUSINESS_ID,
    });
    if (rpcErr) { setError(rpcErr.message || 'Failed to change password.'); }
    else { setDone(true); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1" style={{ background: `linear-gradient(to right, ${BLUE}, ${ORANGE})` }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Change Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">{employee.first_name} {employee.last_name} · @{employee.username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="px-6 pb-6 pt-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-800 mb-1">Password updated</p>
            <p className="text-sm text-slate-400 mb-4">{employee.first_name} can now log in with the new password.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
            {error && <div className="text-sm px-3 py-2 rounded-xl" style={{ background: '#FEF0E8', color: ORANGE }}>{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition"
                  required autoFocus
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6AAEC8] transition"
        required={required}
      />
    </div>
  );
}
