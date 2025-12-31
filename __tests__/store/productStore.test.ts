import { renderHook, act } from '@testing-library/react-native';
import { useProductStore, selectFilteredProducts, selectLowStockProducts } from '@/store/productStore';
import { Product } from '@/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock API
jest.mock('@/services/api', () => ({
  productApi: {
    getProducts: jest.fn(),
    getProductById: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    updateStock: jest.fn(),
    bulkUploadStock: jest.fn(),
  },
}));

const mockProduct: Product = {
  id: '1',
  name: { en: 'Test Product', fr: 'Produit Test', ar: 'منتج اختبار', dz: 'منتج اختبار' },
  description: { en: 'Description', fr: 'Description', ar: 'وصف', dz: 'وصف' },
  images: ['https://example.com/image.jpg'],
  category: 'dresses',
  price: 5000,
  currency: 'DZD',
  sku: 'SKU-001',
  stockByDate: [
    { date: new Date().toISOString().split('T')[0], quantity: 3 },
  ],
  availabilityStatus: 'limited',
  tags: ['summer', 'new'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('productStore', () => {
  beforeEach(() => {
    // Reset store state
    useProductStore.setState({
      products: [],
      selectedProduct: null,
      filters: {},
      isLoading: false,
      error: null,
      lastSynced: null,
      pendingChanges: [],
    });
  });

  describe('setFilters', () => {
    it('should update filters', () => {
      const { result } = renderHook(() => useProductStore());

      act(() => {
        result.current.setFilters({ category: 'dresses' });
      });

      expect(result.current.filters).toEqual({ category: 'dresses' });
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useProductStore());

      act(() => {
        result.current.setFilters({ category: 'dresses', tags: ['summer'] });
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
    });
  });

  describe('selectProduct', () => {
    it('should set selected product', () => {
      const { result } = renderHook(() => useProductStore());

      act(() => {
        result.current.selectProduct(mockProduct);
      });

      expect(result.current.selectedProduct).toEqual(mockProduct);
    });

    it('should clear selected product when null', () => {
      const { result } = renderHook(() => useProductStore());

      act(() => {
        result.current.selectProduct(mockProduct);
      });

      act(() => {
        result.current.selectProduct(null);
      });

      expect(result.current.selectedProduct).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useProductStore());

      useProductStore.setState({ error: 'Test error' });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('productStore selectors', () => {
  const products: Product[] = [
    {
      ...mockProduct,
      id: '1',
      category: 'dresses',
      tags: ['summer'],
      price: 5000,
      availabilityStatus: 'in-stock',
    },
    {
      ...mockProduct,
      id: '2',
      category: 'accessories',
      tags: ['winter'],
      price: 2000,
      availabilityStatus: 'limited',
    },
    {
      ...mockProduct,
      id: '3',
      category: 'dresses',
      tags: ['summer', 'sale'],
      price: 8000,
      availabilityStatus: 'out-of-stock',
    },
  ];

  beforeEach(() => {
    useProductStore.setState({ products, filters: {} });
  });

  describe('selectFilteredProducts', () => {
    it('should return all products when no filters', () => {
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(3);
    });

    it('should filter by category', () => {
      useProductStore.setState({ filters: { category: 'dresses' } });
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(2);
      expect(filtered.every((p) => p.category === 'dresses')).toBe(true);
    });

    it('should filter by tags', () => {
      useProductStore.setState({ filters: { tags: ['summer'] } });
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(2);
    });

    it('should filter by availability status', () => {
      useProductStore.setState({ filters: { availabilityStatus: 'in-stock' } });
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].availabilityStatus).toBe('in-stock');
    });

    it('should filter by price range', () => {
      useProductStore.setState({ filters: { minPrice: 3000, maxPrice: 6000 } });
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].price).toBe(5000);
    });

    it('should combine multiple filters', () => {
      useProductStore.setState({
        filters: { category: 'dresses', tags: ['summer'] },
      });
      const state = useProductStore.getState();
      const filtered = selectFilteredProducts(state);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('selectLowStockProducts', () => {
    it('should return products with stock below threshold', () => {
      const today = new Date().toISOString().split('T')[0];
      const productsWithStock: Product[] = [
        {
          ...mockProduct,
          id: '1',
          stockByDate: [{ date: today, quantity: 2 }],
        },
        {
          ...mockProduct,
          id: '2',
          stockByDate: [{ date: today, quantity: 10 }],
        },
        {
          ...mockProduct,
          id: '3',
          stockByDate: [{ date: today, quantity: 5 }],
        },
      ];

      useProductStore.setState({ products: productsWithStock });
      const state = useProductStore.getState();
      const lowStock = selectLowStockProducts(5)(state);
      
      expect(lowStock).toHaveLength(2);
      expect(lowStock.map((p) => p.id)).toContain('1');
      expect(lowStock.map((p) => p.id)).toContain('3');
    });
  });
});
