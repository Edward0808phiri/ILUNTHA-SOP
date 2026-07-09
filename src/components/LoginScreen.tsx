import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0F0810' }}
    >
      {/* Ambient pearl glow */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="w-[700px] h-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(219,39,119,0.13) 0%, rgba(219,39,119,0.04) 45%, transparent 70%)',
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-600 mb-5"
            style={{ boxShadow: '0 8px 40px rgba(219, 39, 119, 0.45)' }}
          >
            <span
              className="text-white text-2xl leading-none select-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              PP
            </span>
          </div>
          <h1
            className="text-3xl text-white tracking-tight leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Pink Pearl
          </h1>
          <p
            className="text-pink-400/50 text-xs mt-2 tracking-[0.22em] uppercase"
          >
            Point of Sale
          </p>
        </div>

        {/* Form card */}
        <div
          className="bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }}
        >
          {/* Thin pink top stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-pink-400 to-rose-400" />

          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm px-4 py-2.5 rounded-2xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-[0.15em]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3.5 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition bg-slate-50/60"
                  placeholder="you@pinkpearl.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-[0.15em]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition bg-slate-50/60"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-semibold rounded-2xl transition text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ boxShadow: '0 4px 20px rgba(219, 39, 119, 0.35)' }}
            >
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6 tracking-wide">
          Pink Pearl Stores · Staff Portal
        </p>
      </div>
    </div>
  );
}
