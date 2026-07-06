import { useEffect, useState, useCallback } from 'react';
import { LogOut, Search, Grid3X3, Sparkles, ShoppingCart } from 'lucide-react';
import { supabase, BUSINESS_ID, COMPANY_ID } from '../lib/supabase';
import type { Employee, Settings, Product, Service, Category, CartItem } from '../lib/types';
import Cart from './Cart';
import CheckoutModal from './CheckoutModal';

interface Props {
  employee: Employee;
  settings: Settings;
  onLogout: () => void;
}

type TabView = 'products' | 'services';

export default function PosScreen({ employee, settings, onLogout }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'all'>('all');
  const [tabView, setTabView] = useState<TabView>('products');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);

  const cs = settings.currency_symbol;

  useEffect(() => {
    async function load() {
      setLoadingItems(true);
      const [prodRes, svcRes, catRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, sku, price, color_hex, image_url, status, category_id, category:categories(name)')
          .eq('business_id', BUSINESS_ID)
          .eq('status', 'active')
          .order('name'),
        supabase
          .from('services')
          .select('id, name, price, is_active')
          .eq('business_id', BUSINESS_ID)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .eq('business_id', BUSINESS_ID)
          .order('sort_order'),
      ]);
      if (prodRes.data) setProducts(prodRes.data as unknown as Product[]);
      if (svcRes.data) setServices(svcRes.data as Service[]);
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoadingItems(false);
    }
    load();
  }, []);

  const addProduct = useCallback((p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.type === 'product' && i.id === p.id);
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { type: 'product', id: p.id, name: p.name, price: Number(p.price), quantity: 1, cost: 0 }];
    });
  }, []);

  const addService = useCallback((s: Service) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.type === 'service' && i.id === s.id);
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { type: 'service', id: s.id, name: s.name, price: Number(s.price), quantity: 1, cost: 0 }];
    });
  }, []);

  const visibleProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.category_id === activeCategoryId;
    const matchesSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleServices = services.filter((s) =>
    !search.trim() || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-sm leading-none truncate">{settings.store_name}</div>
            <div className="text-xs text-slate-500 truncate">{settings.branch_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:block truncate">{employee.first_name} {employee.last_name}</span>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: product/service grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + tab */}
          <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button
              onClick={() => setTabView('products')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${tabView === 'products' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">Products</span>
            </button>
            <button
              onClick={() => setTabView('services')}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${tabView === 'services' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </button>
          </div>

          {/* Category pills (products only) */}
          {tabView === 'products' && categories.length > 0 && (
            <div className="bg-white border-b border-slate-100 px-3 py-2 flex gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveCategoryId('all')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategoryId === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategoryId === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingItems ? (
              <div className="flex items-center justify-center h-48 text-slate-400">
                <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tabView === 'products' ? (
              visibleProducts.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No products found</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {visibleProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="bg-white rounded-2xl p-3 text-left shadow-sm active:scale-95 transition-transform border border-transparent active:border-indigo-300 hover:shadow-md"
                    >
                      <div
                        className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: p.color_hex || '#6366f1' }}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="font-medium text-slate-800 text-sm leading-tight line-clamp-2">{p.name}</div>
                      <div className="text-indigo-600 font-bold text-sm mt-1">{cs}{Number(p.price).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              visibleServices.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No services found</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {visibleServices.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addService(s)}
                      className="bg-white rounded-2xl p-4 text-left shadow-sm active:scale-95 transition-transform border border-transparent active:border-violet-300 hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6 text-violet-600" />
                      </div>
                      <div className="font-medium text-slate-800 text-sm leading-tight">{s.name}</div>
                      <div className="text-violet-600 font-bold text-sm mt-1">{cs}{Number(s.price).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right: cart (desktop) */}
        <div className="hidden lg:flex w-80 xl:w-96 shrink-0">
          <Cart
            cart={cart}
            setCart={setCart}
            currencySymbol={cs}
            taxRate={settings.tax_rate}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      {/* Mobile cart button */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="bg-indigo-600 text-white rounded-2xl px-5 py-3.5 font-semibold shadow-xl flex items-center gap-3 active:bg-indigo-700"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">
              {cs}{cart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          setCart={setCart}
          employee={employee}
          settings={settings}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
