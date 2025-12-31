# Boutique Manager - Women's Boutique Mobile App

A production-ready React Native (Expo) mobile application for managing a women's boutique. Features owner-facing management tools and a customer-lite view with full multilingual support including RTL languages.

## Features

- **Multi-role Authentication**: Owner (full CRUD), Staff (limited), Customer (view + order interest)
- **Product Management**: Full CRUD with translated content, images, categories, and tags
- **Daily Stock Calendar**: 7-day timeline view and monthly calendar for stock management
- **Bulk Stock Upload**: CSV import for daily availability data
- **Multilingual Support**: English, French, Arabic (RTL), and Algerian Darija (RTL)
- **Offline Support**: Read-through cache with sync strategy and optimistic UI updates
- **Push Notifications**: Low-stock alerts, new orders, and order updates

## Tech Stack

- **Framework**: React Native with Expo SDK 50
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand with persistence
- **Internationalization**: react-i18next + expo-localization
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios with interceptors
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
boutique-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ProductList.tsx
│   │   ├── ProductCalendar.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── OfflineBanner.tsx
│   ├── screens/          # Screen components
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── DashboardScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/       # Navigation configuration
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── productStore.ts
│   │   └── settingsStore.ts
│   ├── services/         # API services
│   ├── hooks/            # Custom hooks
│   ├── i18n/             # Internationalization
│   │   ├── locales/      # Translation files
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   ├── ar.json
│   │   │   └── dz.json   # Algerian Darija
│   │   └── index.ts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│       └── rtl.ts        # RTL helpers
├── __tests__/            # Test files
├── docs/
│   └── api-contract.yaml # OpenAPI specification
└── App.tsx
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
cd boutique-app

# Install dependencies
npm install

# Start the development server
npm start
```

### Running on Device/Emulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web (limited support)
npm run web
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=https://api.boutique.example.com/v1
```

### API Backend

The app expects a REST API backend. See `docs/api-contract.yaml` for the full OpenAPI specification.

## Internationalization

### Supported Locales

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `fr` | French | LTR |
| `ar` | Arabic | RTL |
| `dz` | Algerian Darija | RTL |

### Fallback Chain

`Current Locale → French → English`

### Adding Translations

1. Add translations to `src/i18n/locales/{locale}.json`
2. Use in components:

```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('products.title')}</Text>
```

### RTL Support

RTL layouts are automatically applied for Arabic and Darija. Use RTL utilities:

```tsx
import { isRTL, getFlexDirection, getTextAlign } from '@/utils/rtl';

<View style={{ flexDirection: getFlexDirection() }}>
  <Text style={{ textAlign: getTextAlign() }}>{text}</Text>
</View>
```

## Data Models

### Product

```typescript
interface Product {
  id: string;
  name: TranslatedText;        // { en, fr, ar, dz }
  description: TranslatedText;
  images: string[];
  category: string;
  price: number;
  currency: string;
  sku: string;
  stockByDate: StockByDate[];  // [{ date, quantity }]
  availabilityStatus: 'in-stock' | 'limited' | 'out-of-stock';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### User Roles

- **Owner**: Full CRUD on products, orders, categories, tags
- **Staff**: View all, edit products and orders
- **Customer**: View products, create order requests

## Offline Support

The app implements a read-through cache with optimistic updates:

1. **Read Operations**: Serve from cache, refresh in background
2. **Write Operations**: Apply optimistically, queue for sync
3. **Sync**: Automatic when online, manual trigger available

Pending changes are persisted and synced when connectivity is restored.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- productStore.test.ts
```

### Test Structure

- `__tests__/store/` - Store/reducer tests
- `__tests__/hooks/` - Custom hook tests
- `__tests__/utils/` - Utility function tests
- `__tests__/components/` - Component integration tests

## Building for Production

### Expo EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Environment-specific Builds

```bash
# Production
eas build --platform all --profile production

# Preview/Staging
eas build --platform all --profile preview
```

## Deployment

### Over-the-Air Updates

```bash
eas update --branch production --message "Bug fixes"
```

### App Store / Play Store

1. Build production binaries with EAS
2. Submit via `eas submit` or manually upload

## CSV Bulk Upload Format

For bulk stock updates, use this CSV format:

```csv
sku,date,quantity
SKU-001,2024-01-15,10
SKU-001,2024-01-16,8
SKU-002,2024-01-15,5
```

## API Contract

Full API documentation is available in OpenAPI 3.0 format at `docs/api-contract.yaml`.

Key endpoints:
- `POST /auth/login` - User authentication
- `GET /products` - List products with filters
- `PUT /products/{id}/stock` - Update daily stock
- `POST /products/stock/bulk` - Bulk stock upload
- `GET /orders` - List orders
- `PATCH /orders/{id}/status` - Update order status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
