import { create } from 'zustand';
import { Product, ProductCategory } from '@/types';
import { productApi } from '@/services/api';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  lastFetched: number | null;
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

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  isOnline: true,
  lastFetched: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      // Always fetch from server - this is the source of truth
      const products = await productApi.getProducts();
      set({ 
        products, 
        isLoading: false, 
        isOnline: true,
        lastFetched: Date.now()
      });
      console.log(`✅ Fetched ${products.length} products from server`);
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ 
        isLoading: false, 
        isOnline: false,
        error: 'Impossible de charger les produits. Vérifiez votre connexion.'
      });
    }
  },

  addProduct: async (productData) => {
    set({ isLoading: true });
    try {
      const newProduct = await productApi.createProduct(productData);
      set((state) => ({
        products: [newProduct, ...state.products],
        isLoading: false,
      }));
      console.log('✅ Product created on server:', newProduct.id);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      set({ isLoading: false, error: 'Erreur lors de la création du produit' });
      throw error;
    }
  },

  updateProduct: async (id, updates) => {
    // Optimistic update for better UX
    const previousProducts = get().products;
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));

    try {
      await productApi.updateProduct(id, updates);
      console.log('✅ Product updated on server:', id);
    } catch (error) {
      console.error('Error updating product:', error);
      // Rollback on error
      set({ products: previousProducts, error: 'Erreur lors de la mise à jour' });
    }
  },

  deleteProduct: async (id) => {
    const previousProducts = get().products;
    
    // Optimistic delete
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));

    try {
      await productApi.deleteProduct(id);
      console.log('✅ Product deleted from server:', id);
    } catch (error) {
      console.error('Error deleting product:', error);
      // Rollback on error
      set({ products: previousProducts, error: 'Erreur lors de la suppression' });
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
}));

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
