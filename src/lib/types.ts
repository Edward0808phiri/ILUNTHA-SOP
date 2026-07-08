export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'Supervisor' | 'Cashier';
  username: string;
}

export interface Settings {
  store_name: string;
  branch_name: string;
  currency_symbol: string;
  tax_rate: number;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  color_hex: string | null;
  image_url: string | null;
  status: string;
  category_id: string | null;
  category: { name: string } | null;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export interface CartItem {
  type: 'product' | 'service';
  id: string;
  name: string;
  price: number;
  quantity: number;
  cost: number;
}
