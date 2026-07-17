import { useState, useEffect, useRef } from 'react';
import { X, Banknote, CreditCard, Smartphone, LoaderCircle, CheckCircle, User, Search, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CartItem, Employee, Settings } from '../lib/types';

interface Props {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  employee: Employee;
  settings: Settings;
  onClose: () => void;
  onStockUpdated?: () => void;
}

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

type PayMethod = 'cash' | 'card' | 'mobile_money';

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE    = '#C47840';

export default function CheckoutModal({ cart, setCart, employee, settings, onClose, onStockUpdated }: Props) {
  const cs       = settings.currency_symbol;
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax      = subtotal * (settings.tax_rate / 100);
  const total    = subtotal + tax;

  const [method, setMethod]   = useState<PayMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  // Customer picker
  const [customerSearch, setCustomerSearch]   = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [addingNew, setAddingNew]             = useState(false);
  const [newName, setNewName]                 = useState('');
  const [newPhone, setNewPhone]               = useState('');
  const [savingNew, setSavingNew]             = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setCustomerLoading(true);
      const q = customerSearch.trim();
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone')
        .eq('business_id', employee.business_id)
        .eq('is_active', true)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(6);
      setCustomerResults((data ?? []) as CustomerResult[]);
      setShowDropdown(true);
      setCustomerLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch]);

  async function saveNewCustomer() {
    if (!newName.trim()) return;
    setSavingNew(true);
    const parts = newName.trim().split(' ');
    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ') || '';
    const { data, error: e } = await supabase
      .from('customers')
      .insert({
        business_id: employee.business_id,
        company_id:  employee.company_id,
        first_name:  firstName,
        last_name:   lastName,
        phone:       newPhone.trim() || null,
        is_active:   true,
      })
      .select('id, first_name, last_name, phone')
      .single();
    setSavingNew(false);
    if (!e && data) {
      setSelectedCustomer(data as CustomerResult);
      setAddingNew(false);
      setNewName(''); setNewPhone('');
      setCustomerSearch('');
      setCustomerResults([]);
      setShowDropdown(false);
    }
  }

  const tenderedNum = Number(tendered) || 0;
  const change      = method === 'cash' ? Math.max(0, tenderedNum - total) : 0;
  const canCharge   = method !== 'cash' || tenderedNum >= total;

  async function handleCharge() {
    setError('');
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { data: counter } = await supabase
        .from('invoice_counters')
        .select('last_number')
        .eq('business_id', employee.business_id)
        .eq('company_id', employee.company_id)
        .single();

      const nextNum     = (counter?.last_number ?? 0) + 1;
      const invoiceNumber = `INV-${String(nextNum).padStart(6, '0')}`;

      await supabase.from('invoice_counters').upsert({
        business_id: employee.business_id,
        company_id:  employee.company_id,
        last_number: nextNum,
      });

      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          business_id:    employee.business_id,
          company_id:     employee.company_id,
          employee_id:    employee.id,
          customer_id:    selectedCustomer?.id ?? null,
          invoice_number: invoiceNumber,
          subtotal,
          discount_total: 0,
          tax_total:      tax,
          total,
          status:         'completed',
          created_at:     now,
        })
        .select('id')
        .single();

      if (saleErr || !sale) throw new Error(saleErr?.message || 'Failed to create sale');

      const saleItems = cart.map((item) => ({
        business_id:    employee.business_id,
        company_id:     employee.company_id,
        sale_id:        sale.id,
        item_type:      item.type,
        product_id:     item.type === 'product' ? item.id : null,
        service_id:     item.type === 'service' ? item.id : null,
        name_snapshot:  item.name,
        unit_price:     item.price,
        unit_cost:      item.cost,
        quantity:       item.quantity,
        discount_percent: 0,
        tax_rate:       settings.tax_rate,
        line_total:     item.price * item.quantity,
      }));

      await supabase.from('sale_items').insert(saleItems);

      await supabase.from('payments').insert({
        business_id:  employee.business_id,
        company_id:   employee.company_id,
        sale_id:      sale.id,
        method,
        amount:       total,
        tendered:     method === 'cash' ? tenderedNum : total,
        change_given: change,
        created_at:   now,
      });

      // Decrement stock
      const productItems = cart.filter((i) => i.type === 'product');
      for (const item of productItems) {
        const { data: inv } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', item.id)
          .eq('business_id', employee.business_id)
          .single();
        if (inv) {
          await supabase
            .from('inventory')
            .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
            .eq('product_id', item.id)
            .eq('business_id', employee.business_id);
        }
      }

      // Increment customer purchase count
      if (selectedCustomer) {
        const { data: cust } = await supabase
          .from('customers')
          .select('number_of_buys')
          .eq('id', selectedCustomer.id)
          .single();
        await supabase
          .from('customers')
          .update({ number_of_buys: (cust?.number_of_buys ?? 0) + 1 })
          .eq('id', selectedCustomer.id);
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
          {selectedCustomer && (
            <p className="text-slate-500 text-sm mb-1">
              Customer: <strong className="text-slate-700">{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>
            </p>
          )}
          {method === 'cash' && change > 0 && (
            <p className="text-slate-500 text-base mb-1">
              Change: <strong className="text-slate-900">{cs}{change.toFixed(2)}</strong>
            </p>
          )}
          <p className="text-slate-400 text-sm mb-7">Total paid: {cs}{total.toFixed(2)}</p>
          <button
            onClick={onClose}
            className="w-full py-4 text-white font-bold rounded-2xl text-base transition"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, boxShadow: '0 4px 16px rgba(106,174,200,0.35)' }}
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
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition">
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
            <span style={{ color: ORANGE }}>{cs}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer picker */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Customer</p>

          {selectedCustomer ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 border-[#6AAEC8] bg-[#EFF6FA]">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
              >
                {selectedCustomer.first_name[0]}{selectedCustomer.last_name?.[0] ?? ''}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </p>
                {selectedCustomer.phone && (
                  <p className="text-xs text-slate-400">{selectedCustomer.phone}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-slate-500 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : addingNew ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
                placeholder="Full name *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNewCustomer()}
              />
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': BLUE } as React.CSSProperties}
                placeholder="Phone (optional)"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNewCustomer()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddingNew(false); setNewName(''); setNewPhone(''); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewCustomer}
                  disabled={savingNew || !newName.trim()}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
                  style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
                >
                  {savingNew ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                {customerLoading
                  ? <LoaderCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 animate-spin" />
                  : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                }
                <input
                  type="search"
                  placeholder="Search by name or phone…"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  onFocus={() => customerSearch.trim() && setShowDropdown(true)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6AAEC8] focus:border-[#6AAEC8] transition"
                />
              </div>

              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
                  {customerResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">No customers found</div>
                  ) : (
                    customerResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)` }}
                        >
                          {c.first_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.first_name} {c.last_name}</p>
                          {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                        </div>
                      </button>
                    ))
                  )}
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => { setAddingNew(true); setShowDropdown(false); setCustomerSearch(''); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
                      style={{ color: BLUE_DARK }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Add new customer
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-300">Leave blank for walk-in</span>
                <button
                  onClick={() => { setAddingNew(true); setShowDropdown(false); setCustomerSearch(''); }}
                  className="text-xs font-semibold flex items-center gap-1 transition"
                  style={{ color: BLUE_DARK }}
                >
                  <UserPlus className="w-3 h-3" />
                  New customer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Payment method</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'cash',         label: 'Cash',   icon: Banknote },
              { key: 'card',         label: 'Card',   icon: CreditCard },
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
            className="w-full py-4 text-white font-bold rounded-2xl text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
              boxShadow: '0 4px 20px rgba(106,174,200,0.35)',
            }}
          >
            {loading
              ? <LoaderCircle className="w-5 h-5 animate-spin" />
              : <>
                  {selectedCustomer && <User className="w-4 h-4 opacity-75" />}
                  Charge {cs}{total.toFixed(2)}
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
