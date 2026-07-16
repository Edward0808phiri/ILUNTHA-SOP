import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle, User, Lock } from 'lucide-react';
import { supabase, BUSINESS_ID } from '../lib/supabase';
import type { Employee } from '../lib/types';

interface Props {
  authError?: string | null;
  onLogin: (employee: Employee) => void;
}

export default function LoginScreen({ authError, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc('pos_authenticate', {
      p_username: username.trim().toLowerCase(),
      p_password: password,
      p_business_id: BUSINESS_ID,
    });

    if (rpcError) {
      setError('Login failed. Please try again.');
    } else if (!data || data.length === 0) {
      setError('Incorrect username or password.');
    } else {
      const row = data[0];
      onLogin({
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role as Employee['role'],
        username: row.username,
      });
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0C1C28' }}
    >
      {/* Ambient blue glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div
          className="w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(106,174,200,0.18) 0%, rgba(106,174,200,0.06) 45%, transparent 70%)' }}
        />
      </div>
      <div
        className="fixed bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        aria-hidden
        style={{ background: 'radial-gradient(circle, rgba(237,216,112,0.12) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #6AAEC8 0%, #4E96B0 100%)', boxShadow: '0 8px 40px rgba(106,174,200,0.40)' }}
          >
            <span className="text-white text-2xl leading-none select-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
              CS
            </span>
          </div>
          <h1 className="text-3xl text-white tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
            Clearskin
          </h1>
          <p className="text-[11px] mt-2 tracking-[0.22em] uppercase" style={{ color: 'rgba(106,174,200,0.55)' }}>
            North Mead · Point of Sale
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #6AAEC8, #C47840, #EDD870)' }} />

          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            {error && (
              <div className="text-sm px-4 py-2.5 rounded-2xl" style={{ background: '#FEF0E8', color: '#C47840', border: '1px solid #F5D4B8' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-[0.15em]">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3.5 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 bg-slate-50/60 outline-none transition"
                  onFocus={e => e.currentTarget.style.borderColor = '#6AAEC8'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  placeholder="your username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-[0.15em]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 bg-slate-50/60 outline-none transition"
                  onFocus={e => e.currentTarget.style.borderColor = '#6AAEC8'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 text-white font-semibold rounded-2xl transition text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6AAEC8 0%, #4E96B0 100%)', boxShadow: '0 4px 20px rgba(106,174,200,0.40)' }}
            >
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 tracking-wide" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Clearskin · North Mead
        </p>
      </div>
    </div>
  );
}
