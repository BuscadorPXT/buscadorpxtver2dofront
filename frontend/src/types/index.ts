export interface Supplier {
  id: number;
  name: string;
  whatsappNumber: string;
  address?: string;
  description?: string;
  priority?: number | null;
  productCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  color: string;
  storage: string;
  region: string;
  price: number;
  supplier: Supplier;
  sheetDate?: string;
  sheetTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}
