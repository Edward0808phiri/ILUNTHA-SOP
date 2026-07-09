import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import type { CartItem } from '../lib/types';

interface Props {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currencySymbol: string;
  taxRate: number;
  onCheckout: () => void;
}

export default function Cart({ cart, setCart, currencySymbol, taxRate, onCheckout }: Props) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  function adjust(index: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      const item = { ...next[index], quantity: next[index].quantity + delta };
      if (item.quantity <= 0) { next.splice(index, 1); return next; }
      next[index] = item;
      return next;
    });
  }

  function remove(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-pink-100">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4 text-pink-500" />
        </div>
        <span className="font-bold text-slate-800">Cart</span>
        {cart.length > 0 && (
          <span className="ml-auto text-xs bg-pink-100 text-pink-700 font-bold px-2.5 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
            <ShoppingCart className="w-12 h-12 opacity-40" />
            <span className="text-sm font-medium">Cart is empty</span>
            <span className="text-xs opacity-60">Tap a product to add</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {cart.map((item, idx) => (
              <div key={`${item.type}-${item.id}`} className="px-4 py-3 flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{item.name}</div>
                  <div className="text-sm text-pink-500 font-bold mt-0.5">
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => adjust(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition text-slate-500"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => adjust(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center transition text-slate-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(idx)}
                    className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-50 flex items-center justify-center transition ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals + charge */}
      {cart.length > 0 && (
        <div className="border-t border-slate-100 p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium text-slate-600">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax ({taxRate}%)</span>
              <span className="font-medium text-slate-600">{currencySymbol}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl text-slate-900 pt-1.5 border-t border-slate-100">
            <span>Total</span>
            <span className="text-pink-600">{currencySymbol}{total.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full mt-3 py-4 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-bold rounded-2xl transition text-base"
            style={{ boxShadow: '0 4px 16px rgba(219,39,119,0.3)' }}
          >
            Charge {currencySymbol}{total.toFixed(2)}
          </button>
          <button
            onClick={() => setCart([])}
            className="w-full py-2 text-sm text-slate-300 hover:text-slate-500 transition"
          >
            Clear cart
          </button>
        </div>
      )}
    </div>
  );
}
