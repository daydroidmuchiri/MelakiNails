// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  images: string[];
  categoryId: string;
  category: Category;
  badge: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

// ─── Order Types ──────────────────────────────────────────────────────────────

export interface OrderFormData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateOrderPayload extends OrderFormData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string | null;
  phone: string;
  address: string;
  total: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
}

// ─── Filter/Sort Types ────────────────────────────────────────────────────────

export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

export interface ProductFilters {
  categorySlug?: string;
  sort?: SortOption;
  badge?: string;
}
