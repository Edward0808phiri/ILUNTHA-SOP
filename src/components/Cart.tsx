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
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-indigo-500" />
        <span className="font-bold text-slate-800">Cart</span>
        {cart.length > 0 && (
          <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <ShoppingCart className="w-10 h-10 opacity-30" />
            <span className="text-sm">Cart is empty</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <div key={`${item.type}-${item.id}`} className="px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{item.name}</div>
                  <div className="text-sm text-indigo-600 font-semibold">
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => adjust(idx, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center active:bg-slate-200 text-slate-600"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => adjust(idx, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center active:bg-slate-200 text-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(idx)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 flex items-center justify-center ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-slate-100 p-4 space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax ({taxRate}%)</span>
              <span>{currencySymbol}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-slate-900 pt-1">
            <span>Total</span>
            <span>{currencySymbol}{total.toFixed(2)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full mt-3 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition text-base"
          >
            Charge {currencySymbol}{total.toFixed(2)}
          </button>
          <button
            onClick={() => setCart([])}
            className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition"
          >
            Clear cart
          </button>
        </div>
      )}
    </div>
  );
}
