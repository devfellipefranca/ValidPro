// tipos de rspota da API
export interface LoginResponse {
  token: string;
  role: string;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  message: string;
}

export interface ProductResponse {
  product_id: number;
  message: string;
}

export interface Product {
  product_id: number;
  name: string;
  ean: string;
  category: string | null;
  created_at: string;
}

export interface StockItem {
  name: string;
  ean: string;
  expiration_date: string;
  quantity: number;
  days_remaining: number;
  store_name?: string; 
}

export interface Store {
  store_id: number;
  name: string;
  leader: string;
  created_at: string;
}

export interface User {
  username: string;
  role: string;
  created_at?: string;
  store_id?: number;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface ProductFormData {
  name: string;
  ean: string;
}

export interface StoreFormData {
  storeName: string;
  leaderUsername: string;
  leaderPassword: string;
}

export interface UserFormData {
  username: string;
  password: string;
  role: "promoter" | "repositor";
}

export interface StockFormData {
  product_id: number;
  expiration_date: string;
  quantity: number;
  store_id?: number;
}

export interface StockFilterData {
  start_date?: string;
  end_date?: string;
  min_quantity?: number;
  max_quantity?: number;
}

export interface Activity {
  description: string;
  username: string;
  created_at: string;
}
// Tipo de autorizacao 
export type UserRole = "admin" | "leader" | "promoter" | "repositor";
