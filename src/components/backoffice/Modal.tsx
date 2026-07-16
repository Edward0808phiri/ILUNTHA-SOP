import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props { title: string; onClose: () => void; children: ReactNode; }

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 sm:rounded-t-2xl" style={{ background: 'linear-gradient(to right, #6AAEC8, #C47840)' }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6AAEC8] focus:border-[#6AAEC8] transition bg-white";
export const selectCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6AAEC8] focus:border-[#6AAEC8] transition bg-white";
