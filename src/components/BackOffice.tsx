import { useState } from 'react';
import { LayoutDashboard, Package, Receipt, Users, UserCog, ArrowLeft } from 'lucide-react';
import type { Employee, Settings } from '../lib/types';
import InventoryTab from './backoffice/InventoryTab';
import SalesTab from './backoffice/SalesTab';
import CustomersTab from './backoffice/CustomersTab';
import EmployeesTab from './backoffice/EmployeesTab';
import OverviewTab from './backoffice/OverviewTab';

type BOTab = 'overview' | 'inventory' | 'sales' | 'customers' | 'employees';

interface Props {
  employee: Employee;
  settings: Settings;
  onClose: () => void;
}

const TABS: { key: BOTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'inventory',  label: 'Inventory',  icon: Package },
  { key: 'sales',      label: 'Sales',      icon: Receipt },
  { key: 'customers',  label: 'Customers',  icon: Users },
  { key: 'employees',  label: 'Employees',  icon: UserCog },
];

export default function BackOffice({ employee, settings, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<BOTab>('overview');
  const cs = settings.currency_symbol;
  const active = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POS
        </button>
        <span className="text-slate-300">|</span>
        <span className="font-bold text-slate-800">{active.label}</span>
        <span className="ml-auto text-xs text-slate-400">{employee.first_name} · {employee.role}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 bg-white border-r border-slate-200 flex flex-col py-3 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'overview'  && <OverviewTab  settings={settings} />}
          {activeTab === 'inventory' && <InventoryTab currencySymbol={cs} />}
          {activeTab === 'sales'     && <SalesTab     currencySymbol={cs} />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'employees' && <EmployeesTab />}
        </main>
      </div>
    </div>
  );
}
