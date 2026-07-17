import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Employee, Settings } from '../../lib/types';

interface Props { currentEmployee: Employee; settings: Settings; }

const BLUE = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE = '#C47840';

export default function SettingsTab({ currentEmployee, settings }: Props) {
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const strength = password.length === 0 ? null : password.length < 6 ? 'weak' : password.length < 10 ? 'fair' : 'strong';
  const strengthColor = { weak: '#ef4444', fair: ORANGE, strong: '#10b981' }[strength ?? 'weak'];
  const strengthWidth = { weak: '33%', fair: '66%', strong: '100%' }[strength ?? 'weak'];

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: rpcErr } = await supabase.rpc('pos_change_password', {
      p_employee_id: currentEmployee.id,
      p_new_password: password,
      p_business_id: currentEmployee.business_id,
    });
    if (rpcErr) { setError(rpcErr.message || 'Failed to update password.'); }
    else { setSuccess(true); setPassword(''); setConfirm(''); }
    setLoading(false);
  }

  return (
    <div className="max-w-xl space-y-5">

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-16" style={{ background: `linear-gradient(135deg, #0C1C28 0%, #1a3a4a 100%)` }} />
        <div className="px-6 pb-5">
          <div
            className="w-16 h-16 rounded-2xl -mt-8 mb-3 flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, boxShadow: '0 4px 16px rgba(106,174,200,0.40)' }}
          >
            {currentEmployee.first_name[0]}{currentEmployee.last_name[0] ?? ''}
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{currentEmployee.first_name} {currentEmployee.last_name}</h2>
              <p className="text-sm text-slate-400">@{currentEmployee.username}</p>
            </div>
            <span className="mt-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF0E0', color: ORANGE }}>
              {currentEmployee.role}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: '#F8FBFD' }}>
              <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Store</p>
              <p className="text-sm font-semibold text-slate-700">{settings.store_name}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: '#F8FBFD' }}>
              <p className="text-xs text-slate-400 mb-0.5">Branch</p>
              <p className="text-sm font-semibold text-slate-700">{settings.branch_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2.5" style={{ borderColor: BLUE_LIGHT }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BLUE_LIGHT }}>
            <KeyRound className="w-4 h-4" style={{ color: BLUE_DARK }} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Change My Password</p>
            <p className="text-xs text-slate-400">Update your login password</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-5 space-y-4">
          {error && (
            <div className="text-sm px-3 py-2.5 rounded-xl" style={{ background: '#FEF0E8', color: ORANGE, border: `1px solid #F5D4B8` }}>{error}</div>
          )}
          {success && (
            <div className="text-sm px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              Password updated successfully.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min. 6 characters"
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm outline-none transition"
                onFocus={e => e.currentTarget.style.borderColor = BLUE}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {strength && (
              <div className="mt-1.5">
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: strengthWidth, background: strengthColor }} />
                </div>
                <p className="text-xs mt-1 capitalize" style={{ color: strengthColor }}>{strength}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="repeat new password"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition"
              onFocus={e => e.currentTarget.style.borderColor = BLUE}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              required
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
          >
            {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
