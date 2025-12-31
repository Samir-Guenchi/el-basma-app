import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore, useProductStore } from '@/store';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { ProductListScreen } from '@/screens/products/ProductListScreen';
import { ProductDetailScreen } from '@/screens/products/ProductDetailScreen';
import { ProductEditScreen } from '@/screens/products/ProductEditScreen';
import { OrderListScreen } from '@/screens/orders/OrderListScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { PublishingScreen } from '@/screens/PublishingScreen';
import { MoreScreen } from '@/screens/MoreScreen';
import { CustomersScreen } from '@/screens/CustomersScreen';
import { DeliveryScreen } from '@/screens/DeliveryScreen';

import {
  MainTabParamList,
  ProductStackParamList,
  OrderStackParamList,
  MoreStackParamList,
} from './types';

const getApiUrl = () => Platform.OS === 'android' ? 'http://192.168.43.220:3001' : 'http://localhost:3001';
const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `${getApiUrl()}${uri}`;
};

const MainTab = createBottomTabNavigator<MainTabParamList>();
const ProductStack = createNativeStackNavigator<ProductStackParamList>();
const OrderStack = createNativeStackNavigator<OrderStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

const ProductNavigator = () => {
  const { themeMode } = useSettingsStore();
  const isDark = themeMode === 'dark';

  return (
    <ProductStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' },
        headerTintColor: isDark ? '#F5F5F7' : '#1A1A2E',
        headerShadowVisible: false,
      }}
    >
      <ProductStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <ProductStack.Screen name="ProductList" component={ProductListScreen} options={{ headerShown: false }} />
      <ProductStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Détails' }} />
      <ProductStack.Screen name="ProductEdit" component={ProductEditScreen} options={({ route }) => ({
        title: route.params?.product ? 'Modifier' : 'Nouveau',
      })} />
      <ProductStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </ProductStack.Navigator>
  );
};

const OrderNavigator = () => {
  const { themeMode } = useSettingsStore();
  const isDark = themeMode === 'dark';

  return (
    <OrderStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' },
        headerTintColor: isDark ? '#F5F5F7' : '#1A1A2E',
        headerShadowVisible: false,
      }}
    >
      <OrderStack.Screen name="OrderList" component={OrderListScreen} options={{ headerShown: false }} />
    </OrderStack.Navigator>
  );
};

const MoreNavigator = () => {
  const { themeMode } = useSettingsStore();
  const isDark = themeMode === 'dark';

  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' },
        headerTintColor: isDark ? '#F5F5F7' : '#1A1A2E',
        headerShadowVisible: false,
      }}
    >
      <MoreStack.Screen name="MoreHub" component={MoreScreen} options={{ headerShown: false }} />
      <MoreStack.Screen name="PublishingDetail" component={PublishingScreen} options={{ title: 'Publication' }} />
      <MoreStack.Screen name="SettingsDetail" component={SettingsScreen} options={{ title: 'Paramètres' }} />
      <MoreStack.Screen name="CustomersDetail" component={CustomersScreen} options={{ title: 'Clients' }} />
      <MoreStack.Screen name="DeliveryDetail" component={DeliveryScreen} options={{ title: 'Livraison' }} />
    </MoreStack.Navigator>
  );
};

// Simple Search Modal
const SearchModal: React.FC<{ visible: boolean; onClose: () => void; onSelect: (id: string) => void }> = ({ 
  visible, onClose, onSelect 
}) => {
  const { products } = useProductStore();
  const { themeMode } = useSettingsStore();
  const [query, setQuery] = useState('');
  const isDark = themeMode === 'dark';
  const insets = useSafeAreaInsets();

  const bg = isDark ? '#0F0F1A' : '#F5F5F5';
  const card = isDark ? '#1A1A2E' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#1A1A2E';
  const muted = isDark ? '#666' : '#999';
  const accent = '#E91E63';

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: bg, paddingTop: insets.top }]}>
        <View style={[styles.searchBar, { backgroundColor: card }]}>
          <TextInput
            style={[styles.searchInput, { color: text }]}
            placeholder="Rechercher..."
            placeholderTextColor={muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: accent, fontWeight: '600' }}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const hasImage = item.images && Array.isArray(item.images) && item.images.length > 0;
            const imageUri = hasImage ? getImageUrl(item.images[0]) : null;
            
            return (
            <TouchableOpacity
              style={[styles.resultItem, { backgroundColor: card }]}
              onPress={() => { onSelect(item.id); onClose(); setQuery(''); }}
            >
              <View style={[styles.resultThumb, { backgroundColor: isDark ? '#2A2A3E' : '#F0F0F0', overflow: 'hidden' }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons name="hanger" size={20} color={muted} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultName, { color: text }]}>{item.name}</Text>
                <Text style={{ color: muted, fontSize: 13 }}>{item.price.toLocaleString()} DA</Text>
              </View>
            </TouchableOpacity>
          );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: muted }}>
                {query ? 'Aucun résultat' : 'Tapez pour rechercher'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};

// Clean Tab Bar
const TabBar: React.FC<{ state: any; navigation: any }> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { themeMode } = useSettingsStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const isDark = themeMode === 'dark';

  const bg = isDark ? '#1A1A2E' : '#FFFFFF';
  const border = isDark ? '#2A2A3E' : '#F0F0F0';
  const active = '#D4436A';
  const inactive = isDark ? '#555' : '#AAA';

  const tabs = [
    { route: 'Home', icon: 'home', label: 'Accueil' },
    { route: 'Search', icon: 'search', label: 'Recherche' },
    { route: 'Add', icon: 'plus', label: '', isAdd: true },
    { route: 'Orders', icon: 'package', label: 'Commandes' },
    { route: 'More', icon: 'menu', label: 'Plus' },
  ];

  const isActive = (route: string) => {
    if (route === 'Home') return state.index === 0;
    if (route === 'Orders') return state.index === 1;
    if (route === 'More') return state.index === 2;
    return false;
  };

  const onPress = (route: string) => {
    if (route === 'Search') {
      setSearchOpen(true);
    } else if (route === 'Add') {
      navigation.navigate('Home', { screen: 'ProductEdit', params: {} });
    } else if (route === 'Home') {
      navigation.navigate('Home', { screen: 'Dashboard' });
    } else if (route === 'Orders') {
      navigation.navigate('Orders');
    } else if (route === 'More') {
      navigation.navigate('More');
    }
  };

  return (
    <>
      <SearchModal 
        visible={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onSelect={(id) => navigation.navigate('Home', { screen: 'ProductDetail', params: { productId: id } })}
      />
      
      <View style={[styles.tabBar, { backgroundColor: bg, borderTopColor: border, paddingBottom: insets.bottom || 8 }]}>
        {tabs.map((tab) => {
          const focused = isActive(tab.route);
          
          if (tab.isAdd) {
            return (
              <TouchableOpacity 
                key={tab.route} 
                style={styles.addBtn}
                onPress={() => onPress(tab.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.addBtnInner, { backgroundColor: active }]}>
                  <Feather name="plus" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => onPress(tab.route)}
              activeOpacity={0.6}
            >
              <Feather name={tab.icon as any} size={22} color={focused ? active : inactive} />
              <Text style={[styles.tabLabel, { color: focused ? active : inactive }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <MainTab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <MainTab.Screen name="Home" component={ProductNavigator} />
        <MainTab.Screen name="Orders" component={OrderNavigator} />
        <MainTab.Screen name="More" component={MoreNavigator} />
      </MainTab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  addBtn: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  addBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#D4436A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  modal: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default AppNavigator;