import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus } from '@/types';
import { orderApi } from '@/services/api';

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

interface OrderActions {
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  clearError: () => void;
}

type OrderStore = OrderState & OrderActions;

const generateId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,
      error: null,
      isOnline: true,

      fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
          const orders = await orderApi.getOrders();
          set({ orders, isLoading: false, isOnline: true });
        } catch (error) {
          console.error('Error fetching orders:', error);
          set({ isLoading: false, isOnline: false });
        }
      },

      addOrder: async (orderData) => {
        const { isOnline } = get();
        
        if (isOnline) {
          try {
            const newOrder = await orderApi.createOrder(orderData);
            set((state) => ({
              orders: [newOrder, ...state.orders],
            }));
            return newOrder;
          } catch (error) {
            console.error('Error creating order:', error);
            const offlineOrder: Order = {
              ...orderData,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            set((state) => ({
              orders: [offlineOrder, ...state.orders],
              isOnline: false,
            }));
            return offlineOrder;
          }
        } else {
          const offlineOrder: Order = {
            ...orderData,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            orders: [offlineOrder, ...state.orders],
          }));
          return offlineOrder;
        }
      },

      updateOrderStatus: async (id, status) => {
        const { isOnline } = get();
        
        // Optimistic update
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o
          ),
        }));

        if (isOnline) {
          try {
            await orderApi.updateOrder(id, { status });
          } catch (error) {
            console.error('Error updating order:', error);
            set({ isOnline: false });
          }
        }
      },

      deleteOrder: async (id) => {
        const { isOnline, orders } = get();
        const orderToDelete = orders.find(o => o.id === id);
        
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        }));

        if (isOnline) {
          try {
            await orderApi.deleteOrder(id);
          } catch (error) {
            console.error('Error deleting order:', error);
            if (orderToDelete) {
              set((state) => ({
                orders: [orderToDelete, ...state.orders],
                isOnline: false,
              }));
            }
          }
        }
      },

      getOrderById: (id) => {
        return get().orders.find((o) => o.id === id);
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter((o) => o.status === status);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'orders-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectAllOrders = (state: OrderStore) => state.orders;
export const selectPendingOrders = (state: OrderStore) => 
  state.orders.filter((o) => o.status === 'pending');
export const selectCompletedOrders = (state: OrderStore) => 
  state.orders.filter((o) => o.status === 'delivered');
