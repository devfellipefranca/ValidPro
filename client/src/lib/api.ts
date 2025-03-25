import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

// Create Axios instance
const baseURL = 'http://localhost:3000'; // Default API base URL

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { toast } = useToast();
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        toast({
          variant: "destructive",
          title: "Session expired",
          description: "Please log in again"
        });
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// AUTH SERVICES
export const authService = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  }
};

// ADMIN SERVICES
export const adminService = {
  createStore: async (storeName: string, leaderUsername: string, leaderPassword: string) => {
    const response = await api.post('/admin/stores', { storeName, leaderUsername, leaderPassword });
    return response.data;
  }
};

// LEADER SERVICES
export const leaderService = {
  createUser: async (username: string, password: string, role: string) => {
    const response = await api.post('/leader/users', { username, password, role });
    return response.data;
  }
};

// PRODUCTS SERVICES
export const productService = {
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  
  createProduct: async (name: string, ean: string) => {
    const response = await api.post('/products', { name, ean });
    return response.data;
  },
  
  searchProducts: async (query: string) => {
    const response = await api.get(`/products/search?q=${query}`);
    return response.data;
  }
};

// STOCK SERVICES
export const stockService = {
  getStock: async (filters?: { 
    start_date?: string; 
    end_date?: string; 
    min_quantity?: number; 
    max_quantity?: number; 
  }) => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.min_quantity) params.append('min_quantity', filters.min_quantity.toString());
    if (filters?.max_quantity) params.append('max_quantity', filters.max_quantity.toString());
    
    const response = await api.get(`/stock?${params.toString()}`);
    return response.data;
  },
  
  addStock: async (product_id: number, expiration_date: string, quantity: number, store_id?: number) => {
    const stockData: any = { 
      product_id, 
      expiration_date, 
      quantity 
    };
    
    if (store_id) {
      stockData.store_id = store_id;
    }
    
    const response = await api.post('/stock', stockData);
    return response.data;
  }
};

export default api;
