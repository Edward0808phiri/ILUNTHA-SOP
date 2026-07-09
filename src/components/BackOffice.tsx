import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Sparkles, Tag, Receipt, Users, UserCog, ArrowLeft } from 'lucide-react';
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
  { key: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { key: 'products',    label: 'Products',    icon: ShoppingBag },
  { key: 'services',    label: 'Services',    icon: Sparkles },
  { key: 'categories',  label: 'Categories',  icon: Tag },
  { key: 'inventory',   label: 'Stock',       icon: Package },
  { key: 'sales',       label: 'Sales',       icon: Receipt },
  { key: 'customers',   label: 'Customers',   icon: Users },
  { key: 'employees',   label: 'Employees',   icon: UserCog },
];

export default function BackOffice({ employee, settings, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<BOTab>('overview');
  const cs = settings.currency_symbol;
  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-[#FAF5F7] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 hover:text-pink-600 transition text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POS
        </button>
        <span className="text-slate-200">|</span>
        <span
          className="font-bold text-slate-800"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {active.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{employee.first_name}</span>
          <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">{employee.role}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav
          className="w-52 shrink-0 flex flex-col py-3 gap-0.5 overflow-y-auto"
          style={{ background: '#160D10' }}
        >
          <div className="px-4 pt-1 pb-3 mb-1 border-b border-white/5">
            <p className="text-[10px] font-bold text-pink-400/50 uppercase tracking-[0.2em]">Back Office</p>
          </div>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === key
                  ? 'bg-pink-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`}
              style={activeTab === key ? { boxShadow: '0 2px 12px rgba(219,39,119,0.4)' } : {}}
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
