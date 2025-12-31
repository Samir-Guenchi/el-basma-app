import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductCategory } from '@/types';
import { productApi } from '@/services/api';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

interface ProductActions {
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: ProductCategory) => Product[];
  getLowStockProducts: (threshold: number) => Product[];
  searchProducts: (query: string) => Product[];
  clearError: () => void;
  setOnline: (online: boolean) => void;
}

type ProductStore = ProductState & ProductActions;

// Generate unique ID for offline mode
const generateId = () => `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,
      error: null,
      isOnline: true,

      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const products = await productApi.getProducts();
          set({ products, isLoading: false, isOnline: true });
        } catch (error) {
          console.error('Error fetching products:', error);
          set({ isLoading: false, isOnline: false });
          // Keep cached products if offline
        }
      },

      addProduct: async (productData) => {
        const { isOnline } = get();
        
        if (isOnline) {
          try {
            const newProduct = await productApi.createProduct(productData);
            set((state) => ({
              products: [newProduct, ...state.products],
            }));
            return newProduct;
          } catch (error) {
            console.error('Error creating product:', error);
            // Fallback to offline mode
            const offlineProduct: Product = {
              ...productData,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set((state) => ({
              products: [offlineProduct, ...state.products],
              isOnline: false,
            }));
            return offlineProduct;
          }
        } else {
          // Offline mode
          const offlineProduct: Product = {
            ...productData,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            products: [offlineProduct, ...state.products],
          }));
          return offlineProduct;
        }
      },

      updateProduct: async (id, updates) => {
        const { isOnline } = get();
        
        // Optimistic update
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));

        if (isOnline) {
          try {
            await productApi.updateProduct(id, updates);
          } catch (error) {
            console.error('Error updating product:', error);
            set({ isOnline: false });
          }
        }
      },

      deleteProduct: async (id) => {
        const { isOnline, products } = get();
        const productToDelete = products.find(p => p.id === id);
        
        // Optimistic delete
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));

        if (isOnline) {
          try {
            await productApi.deleteProduct(id);
          } catch (error) {
            console.error('Error deleting product:', error);
            // Restore product on error
            if (productToDelete) {
              set((state) => ({
                products: [productToDelete, ...state.products],
                isOnline: false,
              }));
            }
          }
        }
      },

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },

      getProductsByCategory: (category) => {
        return get().products.filter((p) => p.category === category);
      },

      getLowStockProducts: (threshold) => {
        return get().products.filter((p) => p.quantity <= threshold && p.quantity > 0);
      },

      searchProducts: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().products.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
        );
      },

      clearError: () => set({ error: null }),
      
      setOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'products-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectAllProducts = (state: ProductStore) => state.products;
export const selectInStockProducts = (state: ProductStore) => 
  state.products.filter((p) => p.inStock);
export const selectOutOfStockProducts = (state: ProductStore) => 
  state.products.filter((p) => !p.inStock);
export const selectLowStockProducts = (threshold: number) => (state: ProductStore) =>
  state.products.filter((p) => p.quantity <= threshold && p.quantity > 0);
export const selectTotalValue = (state: ProductStore) =>
  state.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
