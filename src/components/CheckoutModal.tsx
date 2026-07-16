import { useState } from 'react';
import { X, Banknote, CreditCard, Smartphone, LoaderCircle, CheckCircle } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../lib/supabase';
import type { CartItem, Employee, Settings } from '../lib/types';

interface Props {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  employee: Employee;
  settings: Settings;
  onClose: () => void;
  onStockUpdated?: () => void;
}

type PayMethod = 'cash' | 'card' | 'mobile_money';

export default function CheckoutModal({ cart, setCart, employee, settings, onClose, onStockUpdated }: Props) {
  const cs = settings.currency_symbol;
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * (settings.tax_rate / 100);
  const total = subtotal + tax;

  const [method, setMethod] = useState<PayMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const tenderedNum = Number(tendered) || 0;
  const change = method === 'cash' ? Math.max(0, tenderedNum - total) : 0;
  const canCharge = method !== 'cash' || tenderedNum >= total;

  async function handleCharge() {
    setError('');
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { data: counter } = await supabase
        .from('invoice_counters')
        .select('last_number')
        .eq('business_id', BUSINESS_ID)
        .eq('company_id', COMPANY_ID)
        .single();

      const nextNum = (counter?.last_number ?? 0) + 1;
      const invoiceNumber = `INV-${String(nextNum).padStart(6, '0')}`;

      await supabase.from('invoice_counters').upsert({
        business_id: BUSINESS_ID,
        company_id: COMPANY_ID,
        last_number: nextNum,
      });

      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          business_id: BUSINESS_ID,
          company_id: COMPANY_ID,
          employee_id: employee.id,
          invoice_number: invoiceNumber,
          subtotal,
          discount_total: 0,
          tax_total: tax,
          total,
          status: 'completed',
          created_at: now,
        })
        .select('id')
        .single();

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Failed to create sale');

      const saleItems = cart.map((item) => ({
        business_id: BUSINESS_ID,
        company_id: COMPANY_ID,
        sale_id: sale.id,
        item_type: item.type,
        product_id: item.type === 'product' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        name_snapshot: item.name,
        unit_price: item.price,
        unit_cost: item.cost,
        quantity: item.quantity,
        discount_percent: 0,
        tax_rate: settings.tax_rate,
        line_total: item.price * item.quantity,
      }));

      await supabase.from('sale_items').insert(saleItems);

      await supabase.from('payments').insert({
        business_id: BUSINESS_ID,
        company_id: COMPANY_ID,
        sale_id: sale.id,
        method,
        amount: total,
        tendered: method === 'cash' ? tenderedNum : total,
        change_given: change,
        created_at: now,
      });

      const productItems = cart.filter((i) => i.type === 'product');
      for (const item of productItems) {
        const { data: inv } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', item.id)
          .eq('business_id', BUSINESS_ID)
          .single();
        if (inv) {
          await supabase
            .from('inventory')
            .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
            .eq('product_id', item.id)
            .eq('business_id', BUSINESS_ID);
        }
      }

      setDone(true);
      setCart([]);
      onStockUpdated?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sale failed. Please try again.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2
            className="text-2xl text-slate-900 mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Sale Complete
          </h2>
          {method === 'cash' && change > 0 && (
            <p className="text-slate-500 text-base mb-1">
              Change: <strong className="text-slate-900">{cs}{change.toFixed(2)}</strong>
            </p>
          )}
          <p className="text-slate-400 text-sm mb-7">Total paid: {cs}{total.toFixed(2)}</p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#6AAEC8] hover:bg-[#4E96B0] text-white font-bold rounded-2xl text-base transition"
            style={{ boxShadow: '0 4px 16px rgba(106,174,200,0.35)' }}
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Top accent */}
        <div className="h-1 w-full sm:rounded-t-3xl" style={{ background: 'linear-gradient(to right, #6AAEC8, #C47840, #EDD870)' }} />

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2
            className="text-xl text-slate-900"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            Checkout
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order summary */}
        <div className="px-5 space-y-1.5 pb-4 border-b border-slate-100">
          {cart.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex justify-between text-sm">
              <span className="text-slate-500">{item.name} × {item.quantity}</span>
              <span className="text-slate-700 font-semibold">{cs}{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {settings.tax_rate > 0 && (
            <div className="flex justify-between text-sm pt-1.5 border-t border-slate-100 mt-1">
              <span className="text-slate-400">Tax ({settings.tax_rate}%)</span>
              <span className="text-slate-500">{cs}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl pt-2">
            <span className="text-slate-900">Total</span>
            <span className="text-[#C47840]">{cs}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Payment method</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'cash', label: 'Cash', icon: Banknote },
              { key: 'card', label: 'Card', icon: CreditCard },
              { key: 'mobile_money', label: 'Mobile', icon: Smartphone },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition border-2 ${
                  method === key
                    ? 'border-[#6AAEC8] bg-[#D4EBF5] text-[#4E96B0]'
                    : 'border-slate-100 text-slate-500 hover:border-[#6AAEC8] hover:bg-[#EFF6FA]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash tendered */}
        {method === 'cash' && (
          <div className="px-5 pt-2 pb-3">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Amount tendered
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder={`${cs}${total.toFixed(2)}`}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#6AAEC8] focus:border-[#6AAEC8] transition"
            />
            {tenderedNum >= total && (
              <div className="mt-2.5 bg-emerald-50 rounded-xl px-4 py-2.5 text-center">
                <span className="text-slate-500 text-sm">Change: </span>
                <strong className="text-emerald-700 text-lg">{cs}{change.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-5 mb-3 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
        )}

        <div className="px-5 pb-7 pt-2">
          <button
            onClick={handleCharge}
            disabled={loading || !canCharge}
            className="w-full py-4 bg-[#6AAEC8] hover:bg-[#4E96B0] active:bg-[#3D84A0] text-white font-bold rounded-2xl text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 20px rgba(106,174,200,0.35)' }}
          >
            {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : `Charge ${cs}${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
