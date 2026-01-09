# El Basma App

A React Native mobile application for managing a traditional clothing boutique (Djellaba El Basma). Built with Expo and following SOLID principles and clean architecture patterns.

## Architecture Overview

The application follows a layered architecture based on SOLID principles:

```
src/
├── domain/           # Business entities and repository interfaces
├── infrastructure/   # API client, repository implementations, external services
├── application/      # State management (Zustand stores)
├── presentation/     # UI components
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization
├── theme/            # Theme configuration
├── context/          # React contexts
├── utils/            # Utility functions
├── config/           # App configuration
├── services/         # Legacy service exports (backward compatibility)
├── store/            # Legacy store exports (backward compatibility)
├── components/       # Legacy component exports (backward compatibility)
└── types/            # Legacy type exports (backward compatibility)
```

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each entity file contains only one data structure
- Each repository handles only one domain entity
- Each store manages only one slice of state

### Open/Closed Principle (OCP)
- Repository interfaces allow adding new implementations without modifying existing code
- Entity exports are centralized for easy extension

### Liskov Substitution Principle (LSP)
- Repository implementations can be swapped without affecting consumers
- All repositories implement their respective interfaces

### Interface Segregation Principle (ISP)
- Small, focused interfaces for each repository
- Separate interfaces for different concerns (products, orders, settings)

### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions (interfaces)
- Infrastructure layer implements domain interfaces
- Application layer uses abstractions, not concrete implementations

## Layer Descriptions

### Domain Layer (`src/domain/`)
Contains business entities and repository interfaces. This layer has no dependencies on other layers.

- `entities/` - Data structures (Product, Order, User, Settings, Notification)
- `repositories/` - Interface definitions for data access

### Infrastructure Layer (`src/infrastructure/`)
Contains implementations of domain interfaces and external service integrations.

- `api/` - HTTP client configuration and base URL management
- `repositories/` - Concrete implementations of domain repository interfaces
- `services/` - External services (Upload, Chat)

### Application Layer (`src/application/`)
Contains state management using Zustand stores.

- `state/` - Zustand stores for auth, products, orders, settings, LLM settings

### Presentation Layer (`src/presentation/`)
Contains reusable UI components.

- `components/common/` - Shared components (Toast, OfflineBanner, LanguageSwitcher)

## Features

- Product management (CRUD operations)
- Order tracking and management
- Multi-language support (French, English, Arabic, Algerian dialect)
- Dark/Light theme support
- Offline capability with optimistic updates
- Image and video upload with embedding support
- Category management
- Low stock alerts
- Real-time sync with backend

## Tech Stack

- React Native with Expo
- TypeScript
- Zustand for state management
- React Navigation
- Axios for HTTP requests
- i18next for internationalization
- AsyncStorage for local persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Environment Configuration

The app connects to a backend API. Configure the API URL in `src/infrastructure/api/config.ts`:

- Production: `https://web-production-1c70.up.railway.app/api`
- Development Android: `http://192.168.43.220:3001/api`
- Development iOS: `http://localhost:3001/api`

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure Details

### Backward Compatibility

Legacy import paths are maintained through re-export files:
- `src/types/index.ts` re-exports from `domain/entities`
- `src/store/index.ts` re-exports from `application/state`
- `src/components/index.ts` re-exports from `presentation/components`
- `src/services/api.ts` provides legacy API object format

### Adding New Features

1. Define entities in `domain/entities/`
2. Create repository interface in `domain/repositories/`
3. Implement repository in `infrastructure/repositories/`
4. Create state store in `application/state/`
5. Build UI components in `presentation/components/`
6. Create screens in `screens/`

## License

Private - All rights reserved
