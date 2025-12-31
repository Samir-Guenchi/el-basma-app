import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// Default owner user - no login required (single user app)
const defaultUser: User = {
  id: 'owner-1',
  email: 'owner@boutique.local',
  name: 'Boutique Owner',
  role: 'owner',
  preferredLocale: 'fr',
  createdAt: new Date().toISOString(),
};

const initialState: AuthState = {
  user: defaultUser,
  tokens: null,
  isAuthenticated: true, // Always authenticated
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectUserRole = (state: AuthStore) => state.user?.role;
export const selectIsOwner = (state: AuthStore) => state.user?.role === 'owner';
export const selectIsStaff = (state: AuthStore) => state.user?.role === 'staff';
export const selectIsCustomer = (state: AuthStore) => state.user?.role === 'customer';
