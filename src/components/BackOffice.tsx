import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Sparkles, Tag, Receipt, Users, UserCog, ArrowLeft, MapPin } from 'lucide-react';
import type { Employee, Settings } from '../lib/types';
import OverviewTab from './backoffice/OverviewTab';
import ProductsTab from './backoffice/ProductsTab';
import ServicesTab from './backoffice/ServicesTab';
import CategoriesTab from './backoffice/CategoriesTab';
import InventoryTab from './backoffice/InventoryTab';
import SalesTab from './backoffice/SalesTab';
import CustomersTab from './backoffice/CustomersTab';
import EmployeesTab from './backoffice/EmployeesTab';

type BOTab = 'overview' | 'products' | 'services' | 'categories' | 'inventory' | 'sales' | 'customers' | 'employees';

interface Props {
  employee: Employee;
  settings: Settings;
  onClose: () => void;
}

const TABS: { key: BOTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'products',   label: 'Products',   icon: ShoppingBag },
  { key: 'services',   label: 'Services',   icon: Sparkles },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'inventory',  label: 'Stock',      icon: Package },
  { key: 'sales',      label: 'Sales',      icon: Receipt },
  { key: 'customers',  label: 'Customers',  icon: Users },
  { key: 'employees',  label: 'Employees',  icon: UserCog },
];

const BLUE      = '#6AAEC8';
const BLUE_DARK = '#4E96B0';
const ORANGE    = '#C47840';
const SIDEBAR   = '#0C1C28';

export default function BackOffice({ employee, settings, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<BOTab>('overview');
  const cs = settings.currency_symbol;
  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#EFF6FA' }}>
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm" style={{ borderColor: '#D4EBF5' }}>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 text-sm font-semibold transition"
          onMouseEnter={e => e.currentTarget.style.color = BLUE_DARK}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POS
        </button>
        <span className="text-slate-200">|</span>
        <span className="font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {active.label}
        </span>

        {/* Branch badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#D4EBF5', color: BLUE_DARK }}>
          <MapPin className="w-3 h-3" />
          {settings.store_name} · {settings.branch_name}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{employee.first_name}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF0E0', color: ORANGE }}>
            {employee.role}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 flex flex-col py-3 gap-0.5 overflow-y-auto" style={{ background: SIDEBAR }}>
          <div className="px-4 pt-1 pb-3 mb-1 border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${BLUE}80` }}>
              Back Office
            </p>
            <p className="text-[10px] text-white/25 mt-0.5 truncate">{settings.store_name}</p>
          </div>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition"
              style={activeTab === key
                ? { background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_DARK} 100%)`, color: 'white', boxShadow: `0 2px 12px rgba(106,174,200,0.40)` }
                : { color: '#94a3b8' }
              }
              onMouseEnter={e => { if (activeTab !== key) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (activeTab !== key) e.currentTarget.style.background = ''; }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'overview'   && <OverviewTab   settings={settings} />}
          {activeTab === 'products'   && <ProductsTab   currencySymbol={cs} />}
          {activeTab === 'services'   && <ServicesTab   currencySymbol={cs} />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'inventory'  && <InventoryTab  currencySymbol={cs} />}
          {activeTab === 'sales'      && <SalesTab      currencySymbol={cs} />}
          {activeTab === 'customers'  && <CustomersTab />}
          {activeTab === 'employees'  && <EmployeesTab />}
        </main>
      </div>
    </div>
  );
}
