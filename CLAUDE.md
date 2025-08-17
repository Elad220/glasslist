# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Testing
```bash
npm run test             # Run tests with Vitest
npm run test:run         # Run tests once (CI mode)
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
```

## Architecture Overview

GlassList is a modern shopping list application built with glassmorphism design and AI-powered features.

### Technology Stack
- **Next.js 15** with App Router and TypeScript
- **Supabase** for database, authentication, and storage
- **Google Gemini AI** for natural language processing
- **Tailwind CSS v4** for styling with glassmorphism design
- **Vitest** for testing

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication flow
│   ├── dashboard/         # Main dashboard
│   ├── list/[listId]/     # Individual shopping lists
│   ├── settings/          # User settings
│   └── layout.tsx         # Root layout with providers
├── components/            # Reusable React components
├── lib/                   # Core utilities and configurations
│   ├── ai/               # Google Gemini AI integration
│   ├── auth/             # Authentication utilities
│   ├── offline/          # Offline-first data layer
│   ├── supabase/         # Database client and operations
│   ├── theme/            # Theme context and utilities
│   ├── toast/            # Notification system
│   └── undo-redo/        # Undo/redo functionality
└── test/                  # Test files with setup
```

### Core Features
- **Offline-First Architecture**: All data operations work offline with automatic sync
- **AI-Powered Quick Add**: Natural language parsing for shopping lists
- **Glassmorphism Design**: Backdrop blur effects with transparent glass components
- **Voice Input**: Voice-to-text with AI parsing
- **Collaborative Lists**: Share lists with family members
- **Analytics & Insights**: Track shopping patterns and provide smart suggestions

### Database Schema
Key tables:
- `profiles` - User profiles with encrypted API keys
- `shopping_lists` - Lists with category ordering and sharing features
- `items` - Shopping list items with drag-drop positioning
- `list_members` - Collaborative list memberships

### Security & Data Protection
- **Row Level Security (RLS)** enabled on all Supabase tables
- **Encrypted API Keys** using AES-256 encryption for user's Gemini API keys
- **Application-level security** with ownership verification before operations
- **Environment variables** for all sensitive configuration

### Offline Capabilities
The app uses an offline-first architecture:
- **Local Storage**: IndexedDB for persistent offline data
- **Automatic Sync**: Background synchronization when online
- **Conflict Resolution**: Timestamp-based conflict resolution
- **Operation Queue**: Queued operations for offline actions

### AI Integration
- **Google Gemini AI** for parsing natural language shopping lists
- **Fallback Parser** for basic parsing when AI is unavailable
- **Voice Analysis** for voice-to-shopping-list conversion
- **Smart Categorization** for automatic item categorization

## Development Guidelines

### Code Style
- Follow the `.cursorrules` file for consistent code patterns
- Use TypeScript with strict mode
- Implement glassmorphism design with `backdrop-blur-md bg-white/10` patterns
- Always handle loading states and errors gracefully

### Database Operations
- Use the offline client functions exported from `src/lib/supabase/client.ts`
- Always verify user authentication before database operations
- Handle RLS policy errors appropriately
- Update list timestamps when modifying items

### AI Operations
- Always implement fallback parsing for AI failures
- Handle API key validation and encryption
- Provide clear error messages for AI-related issues
- Cache AI responses when appropriate

### Testing
- Tests are located in `src/test/` with setup in `src/test/setup.ts`
- Use Vitest with jsdom environment
- Mock Supabase client in tests using `src/test/mocks/supabase.ts`
- Test both online and offline scenarios

### Components
- Use functional components with hooks
- Implement proper loading and error states
- Follow accessibility best practices
- Use Lucide React icons consistently

## Common Development Tasks

### Adding New Features
1. Create feature branch
2. Add database schema changes to `sql/` directory if needed
3. Implement offline-first data operations in `src/lib/offline/`
4. Create UI components with glassmorphism design
5. Add tests for new functionality
6. Run `npm run lint` and `npm run test` before committing

### Debugging Database Issues
- Check RLS policies in Supabase dashboard
- Verify user authentication status
- Use Supabase logs for error details
- Test with RLS disabled temporarily for debugging

### Working with AI Features
- Test with and without valid API keys
- Implement proper error handling for rate limits
- Use fallback parsing for robustness
- Handle voice input format conversions

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Performance Considerations
- Use Next.js Image component for optimized images
- Implement lazy loading for components
- Use React.memo for expensive components
- Minimize bundle size with proper imports
- Leverage Next.js caching features