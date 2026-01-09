import { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '@/types';

export type MainTabParamList = {
  Home: NavigatorScreenParams<ProductStackParamList>;
  Orders: NavigatorScreenParams<OrderStackParamList>;
  More: NavigatorScreenParams<MoreStackParamList>;
};

export type ProductStackParamList = {
  Dashboard: undefined;
  ProductList: undefined;
  ProductDetail: { productId: string };
  ProductEdit: { product?: Product };
  Settings: undefined;
};

export type OrderStackParamList = {
  OrderList: undefined;
  OrderDetail: { orderId: string };
};

export type MoreStackParamList = {
  MoreHub: undefined;
  PublishingDetail: undefined;
  SettingsDetail: undefined;
  CustomersDetail: { filter?: 'all' | 'completed' | 'cancelled' } | undefined;
  DeliveryDetail: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainTabParamList {}
  }
}
