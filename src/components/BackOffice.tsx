import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Sparkles, Tag, Receipt, Users, UserCog, Settings, ArrowLeft, MapPin, Menu, X, Activity } from 'lucide-react';
import type { Employee, Settings as SettingsType } from '../lib/types';
import OverviewTab    from './backoffice/OverviewTab';
import ProductsTab    from './backoffice/ProductsTab';
import ServicesTab    from './backoffice/ServicesTab';
import CategoriesTab  from './backoffice/CategoriesTab';
import InventoryTab   from './backoffice/InventoryTab';
import SalesTab       from './backoffice/SalesTab';
import CustomersTab   from './backoffice/CustomersTab';
import EmployeesTab   from './backoffice/EmployeesTab';
import SettingsTab    from './backoffice/SettingsTab';
import EventsTab     from './backoffice/EventsTab';

type BOTab = 'overview' | 'products' | 'services' | 'categories' | 'inventory' | 'sales' | 'customers' | 'employees' | 'events' | 'settings';

interface Props { employee: Employee; settings: SettingsType; onClose: () => void; }

const TABS: { key: BOTab; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { key: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { key: 'products',   label: 'Products',    icon: ShoppingBag },
  { key: 'services',   label: 'Services',    icon: Sparkles },
  { key: 'categories', label: 'Categories',  icon: Tag },
  { key: 'inventory',  label: 'Stock',       icon: Package },
  { key: 'sales',      label: 'Sales',       icon: Receipt },
  { key: 'customers',  label: 'Customers',   icon: Users },
  { key: 'employees',  label: 'Employees',   icon: UserCog, adminOnly: true },
  { key: 'events',     label: 'Events',      icon: Activity, adminOnly: true },
  { key: 'settings',   label: 'Settings',    icon: Settings },
];

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const ORANGE    = '#C47840';
const SIDEBAR   = '#0C1C28';

export default function BackOffice({ employee, settings, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<BOTab>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cs = settings.currency_symbol;

  const visibleTabs = TABS.filter(t => !t.adminOnly || employee.role === 'Admin');
  const active = visibleTabs.find(t => t.key === activeTab) ?? visibleTabs[0];

  function navigate(tab: BOTab) {
    setActiveTab(tab);
    setDrawerOpen(false);
  }

  const NavItem = ({ tab }: { tab: typeof TABS[number] }) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        onClick={() => navigate(tab.key)}
        className="w-full flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition"
        style={isActive
          ? { background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, color: 'white', boxShadow: `0 2px 12px rgba(106,174,200,0.40)` }
          : { color: '#94a3b8' }
        }
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = ''; }}
      >
        <tab.icon className="w-4 h-4 shrink-0" />
        {tab.label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#EFF6FA' }}>
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm z-30" style={{ borderColor: '#D4EBF5' }}>
        {/* Mobile menu button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition -ml-1"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onClose}
          className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-semibold transition"
          onMouseEnter={e => e.currentTarget.style.color = BLUE_DARK}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POS
        </button>

        <span className="hidden md:inline text-slate-200">|</span>

        <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {active.label}
        </span>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#D4EBF5', color: BLUE_DARK }}>
          <MapPin className="w-3 h-3" />
          {settings.store_name} · {settings.branch_name}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block text-xs text-slate-400 font-medium">{employee.first_name}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF0E0', color: ORANGE }}>
            {employee.role}
          </span>
          {/* Mobile back button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition"
            aria-label="Back to POS"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Sidebar — drawer on mobile, fixed on desktop */}
        <nav
          className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-56 shrink-0 flex flex-col py-3 gap-0.5 overflow-y-auto transition-transform duration-200 md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ background: SIDEBAR, top: 0 }}
        >
          {/* Mobile drawer header */}
          <div className="md:hidden flex items-center justify-between px-4 pt-3 pb-2 mb-1 border-b border-white/10">
            <span className="text-sm font-bold" style={{ color: BLUE }}>Back Office</span>
            <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:block px-4 pt-1 pb-3 mb-1 border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${BLUE}80` }}>Back Office</p>
            <p className="text-[10px] text-white/25 mt-0.5 truncate">{settings.store_name}</p>
          </div>

          {visibleTabs.map(tab => <NavItem key={tab.key} tab={tab} />)}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {activeTab === 'overview'   && <OverviewTab   settings={settings} />}
          {activeTab === 'products'   && <ProductsTab   currencySymbol={cs} />}
          {activeTab === 'services'   && <ServicesTab   currencySymbol={cs} />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'inventory'  && <InventoryTab  currencySymbol={cs} />}
          {activeTab === 'sales'      && <SalesTab      currencySymbol={cs} />}
          {activeTab === 'customers'  && <CustomersTab />}
          {activeTab === 'employees'  && <EmployeesTab  currentEmployee={employee} />}
          {activeTab === 'events'     && <EventsTab     currencySymbol={cs} />}
          {activeTab === 'settings'   && <SettingsTab   currentEmployee={employee} settings={settings} />}
        </main>
      </div>
    </div>
  );
}
