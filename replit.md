# Secure Password Share Web Application

## Overview

This is a secure password sharing web application built with React and Express.js that allows users to temporarily store and share password entries with time-based deletion. The application features a master password-protected system with strong client-server cryptographic security, designed for safe transmission of sensitive information between parties.

The application provides a clean, Material Design-inspired interface with dark mode preference, focusing on user trust and security awareness. Users can create password entries with multiple fields, share them securely, and have them automatically expire after 24 hours or manually delete them immediately.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript, using Vite as the build tool
- **UI Library**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with a custom design system based on Material Design principles
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Dark mode by default with light mode support using CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints with session-based authentication
- **Security Layer**: Multi-layered cryptographic approach using bcrypt for password hashing and AES-256-GCM for data encryption
- **Session Management**: Temporary session tokens with encrypted master password storage for operation scope

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Tables**:
  - `master_password`: Stores hashed master password with salt
  - `password_entries`: Encrypted password entries with expiration timestamps
  - `sessions`: Session management with encrypted master password for operations
  - `users`: Legacy user management (maintained for compatibility)
- **Security Features**: All sensitive data encrypted at rest, unique salts per entry, authentication tags for integrity

### Cryptographic Security
- **Master Password**: bcrypt hashing with 12 rounds
- **Data Encryption**: AES-256-GCM with PBKDF2 key derivation (100,000 iterations)
- **Session Security**: Temporary encrypted storage of master password for operational scope
- **Key Management**: Unique salts and IVs per encrypted entry, no plaintext storage

### Authentication Flow
1. Master password setup (one-time) with strong hashing
2. Session creation with encrypted master password storage
3. Time-limited session tokens for API authentication
4. Automatic session cleanup and password entry expiration

### Data Flow
- Password entries are encrypted client-side before storage
- Decryption occurs server-side using session-stored master password
- Automatic cleanup of expired entries and sessions
- Manual deletion with confirmation dialogs

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Connection**: Environment variable `DATABASE_URL` for database connection

### UI Component Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form validation and management with Zod schema validation

### Cryptographic Libraries
- **bcryptjs**: Password hashing for master password storage
- **crypto-js**: Additional cryptographic utilities for client-side operations
- **Node.js Crypto**: Built-in cryptographic functions for server-side encryption

### Development Tools
- **Vite**: Build tool with hot module replacement and development server
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Drizzle Kit**: Database migration and schema management tools

### Deployment Requirements
- **Node.js Runtime**: Compatible with Render deployment platform
- **Environment Variables**: `DATABASE_URL` for PostgreSQL connection
- **Build Process**: Vite for frontend, esbuild for backend bundling