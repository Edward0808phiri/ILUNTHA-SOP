import { useEffect, useState, useCallback } from 'react';
import { LogOut, Search, Grid3X3, Sparkles, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';
import { supabase, BUSINESS_ID } from '../lib/supabase';
import type { Employee, Settings, Product, Service, Category, CartItem } from '../lib/types';
import Cart from './Cart';
import CheckoutModal from './CheckoutModal';

interface Props {
  employee: Employee;
  settings: Settings;
  onLogout: () => void;
  onOpenBackOffice?: () => void;
}

type TabView = 'products' | 'services';

// Clearskin palette
const BLUE       = '#6AAEC8';
const BLUE_DARK  = '#4E96B0';
const BLUE_LIGHT = '#D4EBF5';
const ORANGE     = '#C47840';
const PAGE_BG    = '#EFF6FA';

export default function PosScreen({ employee, settings, onLogout, onOpenBackOffice }: Props) {
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
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { type: 'product', id: p.id, name: p.name, price: Number(p.price), quantity: 1, cost: 0 }];
    });
  }, []);

  const addService = useCallback((s: Service) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.type === 'service' && i.id === s.id);
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, quantity: i.quantity + 1 } : i);
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
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      {/* Top bar */}
      <header className="bg-white border-b px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-sm" style={{ borderColor: BLUE_LIGHT }}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, boxShadow: `0 2px 12px rgba(106,174,200,0.35)` }}
          >
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm leading-tight truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {settings.store_name}
            </div>
            <div className="text-[11px] font-medium truncate" style={{ color: ORANGE }}>{settings.branch_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-slate-500 font-medium truncate">
            {employee.first_name} {employee.last_name}
          </span>
          {onOpenBackOffice && (
            <button
              onClick={onOpenBackOffice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-500 text-sm font-medium transition border border-slate-100"
              style={{ ['--hover-bg' as string]: BLUE_LIGHT }}
              onMouseEnter={e => { e.currentTarget.style.background = BLUE_LIGHT; e.currentTarget.style.color = BLUE_DARK; e.currentTarget.style.borderColor = BLUE_LIGHT; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '#f1f5f9'; }}
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Back Office</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
            aria-label="Sign out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: product/service grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + tab */}
          <div className="bg-white border-b border-slate-100 px-3 py-2 flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 text-sm outline-none border border-transparent transition"
                onFocus={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.background = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = ''; }}
              />
            </div>
            {(['products', 'services'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTabView(t)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={tabView === t
                  ? { background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, color: 'white', boxShadow: `0 2px 8px rgba(106,174,200,0.35)` }
                  : { background: '#f8fafc', color: '#64748b' }
                }
              >
                {t === 'products' ? <Grid3X3 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span className="hidden sm:inline capitalize">{t}</span>
              </button>
            ))}
          </div>

          {/* Category pills */}
          {tabView === 'products' && categories.length > 0 && (
            <div className="bg-white border-b border-slate-50 px-3 py-2 flex gap-2 overflow-x-auto shrink-0">
              {[{ id: 'all', name: 'All' }, ...categories.map(c => ({ id: c.id, name: c.name }))].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategoryId(c.id)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition"
                  style={activeCategoryId === c.id
                    ? { background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, color: 'white', boxShadow: `0 2px 6px rgba(106,174,200,0.3)` }
                    : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingItems ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${BLUE} transparent ${BLUE} ${BLUE}` }} />
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
                      className="bg-white rounded-2xl p-3 text-left shadow-sm active:scale-95 transition-all hover:shadow-md border border-slate-100 group"
                      onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE_LIGHT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#f1f5f9')}
                    >
                      <div
                        className="w-full aspect-square rounded-xl mb-2.5 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: p.color_hex || BLUE }}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-white/90 select-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{p.name}</div>
                      <div className="font-bold text-sm mt-1" style={{ color: ORANGE }}>
                        {cs}{Number(p.price).toFixed(2)}
                      </div>
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
                      className="bg-white rounded-2xl p-4 text-left shadow-sm active:scale-95 transition-all hover:shadow-md border border-slate-100"
                      onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE_LIGHT)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#f1f5f9')}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: '#FEF0E0' }}>
                        <Sparkles className="w-6 h-6" style={{ color: ORANGE }} />
                      </div>
                      <div className="font-semibold text-slate-800 text-sm leading-tight">{s.name}</div>
                      <div className="font-bold text-sm mt-1" style={{ color: ORANGE }}>
                        {cs}{Number(s.price).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Right: cart (tablet + desktop) */}
        <div className="hidden sm:flex w-72 md:w-80 xl:w-96 shrink-0">
          <Cart cart={cart} setCart={setCart} currencySymbol={cs} taxRate={settings.tax_rate} onCheckout={() => setCheckoutOpen(true)} />
        </div>
      </div>

      {/* Mobile cart button (phones only) */}
      {cartCount > 0 && (
        <div className="sm:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="text-white rounded-2xl px-5 py-3.5 font-semibold flex items-center gap-3 active:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`,
              boxShadow: `0 8px 24px rgba(106,174,200,0.45)`,
            }}
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
