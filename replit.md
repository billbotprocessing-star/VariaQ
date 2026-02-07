# Varia - AI Financial Analysis App

## Overview

Varia is a mobile-first financial analysis application built with Expo (React Native) and an Express backend. Users can input financial data (revenue, COGS, operating expenses, assets, liabilities, equity, cash flows), upload financial documents, and receive calculated financial ratios and AI-generated insights. The app includes analysis history tracking and document management features.

The project follows a monorepo structure with the mobile app (Expo/React Native), Express API server, and shared schema all in one codebase. It's designed to run on Replit with specific environment variable handling for dev/deployment domains.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Routing**: File-based routing via `app/` directory with screens: `login` (auth), `index` (input), `results` (analysis display), `history` (past analyses), `documents` (saved files), `profile` (user profile)
- **State Management**: TanStack React Query for server state; local state with React hooks
- **Local Storage**: AsyncStorage for persisting analysis history and document metadata; expo-file-system for document file storage
- **Styling**: React Native StyleSheet with a dark theme (navy/blue gradient aesthetic defined in `constants/colors.ts`)
- **Fonts**: DM Sans (Google Fonts) loaded via `@expo-google-fonts/dm-sans`
- **Key UI Libraries**: react-native-reanimated, react-native-gesture-handler, expo-haptics, expo-linear-gradient, expo-blur
- **Keyboard Handling**: react-native-keyboard-controller with a cross-platform `KeyboardAwareScrollViewCompat` wrapper

### Backend (Express)
- **Runtime**: Express 5 server in `server/` directory
- **Entry point**: `server/index.ts` — sets up CORS (allowing Replit domains and localhost), JSON parsing, and serves static builds in production
- **Routes**: Defined in `server/routes.ts` — auth (register/login/logout), analyses CRUD, documents CRUD, user profile, all prefixed with `/api`
- **Authentication**: Token-based auth — tokens generated on login/register, stored in `auth_token` column, validated via `Authorization: Bearer <token>` header. `resolveUserId` function resolves user from session or token.
- **Storage Layer**: `server/storage.ts` implements an `IStorage` interface with PostgreSQL-backed storage for users, analyses, and documents.
- **Build**: Server is bundled with esbuild for production (`server_dist/`)

### Shared Code
- **Location**: `shared/schema.ts`
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: drizzle-zod for generating Zod schemas from Drizzle table definitions
- **Current Schema**: `users` table (id UUID, username, password, auth_token, display_name, avatar_url), `analyses` table (id, user_id, data JSONB, date), `documents` table (id, user_id, name, mime_type, size, saved_at, linked_analysis_id)

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory
- **Push command**: `npm run db:push` to sync schema to database
- **Note**: All data (users, analyses, documents) is persisted in PostgreSQL. The `lib/storage.ts` client module talks to the backend API for data persistence.

### Development Workflow
- Two parallel processes in development: Expo dev server (`expo:dev`) and Express server (`server:dev` via tsx)
- Production uses a static Expo web build served by the Express server
- Build script (`scripts/build.js`) handles creating static web bundles with proper domain configuration for Replit deployments

### Key Library Files
- `lib/financial.ts`: Core financial logic — data interfaces, ratio calculations (gross margin, net margin, current ratio, debt-to-equity, ROE), report generation
- `lib/storage.ts`: Client-side persistence layer using AsyncStorage and expo-file-system for analysis history and documents
- `lib/query-client.ts`: API client setup with `getApiUrl()` that constructs URLs from `EXPO_PUBLIC_DOMAIN` env var

## External Dependencies

### Database
- **PostgreSQL** via Drizzle ORM — requires `DATABASE_URL` environment variable
- **Driver**: `pg` package

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for Drizzle)
- `EXPO_PUBLIC_DOMAIN`: Domain for API requests from the Expo app
- `REPLIT_DEV_DOMAIN`: Replit development domain (used for CORS and Expo proxy)
- `REPLIT_DOMAINS`: Comma-separated production domains (used for CORS)
- `REPLIT_INTERNAL_APP_DOMAIN`: Deployment domain for static builds

### Key NPM Packages
- **expo** (~54.0.27): Core framework
- **express** (^5.0.1): Backend server
- **drizzle-orm** (^0.39.3) + **drizzle-kit**: Database ORM and migration tool
- **@tanstack/react-query** (^5.83.0): Data fetching and caching
- **@react-native-async-storage/async-storage**: Local key-value storage
- **zod** + **drizzle-zod**: Schema validation
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development server
- **http-proxy-middleware**: Dev server proxying
- **patch-package**: Post-install patching (runs on `npm install`)