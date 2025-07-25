# GlassList 🛒✨

A beautiful, modern shopping list application with glassmorphism design and AI-powered features. Built with Next.js, Supabase, and Google Gemini AI.

![GlassList Preview](https://via.placeholder.com/800x400/6366f1/white?text=GlassList+-+Beautiful+Shopping+Lists)

## 🔐 Security Features

### **Encrypted API Keys**
- **Secure Storage**: Gemini API keys are encrypted before storage in the database
- **AES-256 Encryption**: Military-grade encryption for sensitive data
- **Auto-Decryption**: Keys are decrypted only when needed for AI operations
- **Environment-Based**: Uses secure environment variables for encryption keys

## 🌟 Features

### ✨ **Glassmorphism Design**
- **Stunning Visual Design**: Frosted glass components with backdrop blur effects
- **Colorful Gradients**: Beautiful multi-color backgrounds that adapt to light/dark mode
- **Modern UI**: Clean, accessible interface with smooth animations
- **Responsive**: Works perfectly on desktop, tablet, and mobile

### 🛍️ **Smart Shopping Lists**
- **Multi-List Support**: Create separate lists for different stores or occasions
- **Smart Organization**: Items automatically grouped by aisle/category
- **Shopping Mode**: Full-screen mode with large text for easy viewing while shopping
- **Item Management**: Add, edit, delete items with detailed information (amount, unit, notes, images)

### 🤖 **AI-Powered Quick Add**
- **Natural Language Processing**: Type "2 liters of milk, a loaf of bread, and a dozen eggs"
- **Smart Categorization**: AI automatically categorizes items (Dairy, Bakery, etc.)
- **Multiple Units**: Supports 20+ units (kg, L, pcs, dozen, etc.)
- **Fallback Parser**: Works even without AI for basic parsing

### 📊 **User Analytics**
- **Shopping Insights**: Track items purchased, most frequent categories
- **Personal Statistics**: Monthly shopping trends and patterns
- **Smart Suggestions**: Based on your shopping history

### 🔐 **Secure & Private**
- **Supabase Authentication**: Secure email/password authentication
- **Row Level Security**: Your data is completely private
- **Personal API Keys**: Store your own Gemini API key securely

### 📱 **Offline Mode & PWA**
- **Full Offline Support**: View and edit lists without internet connection
- **Automatic Sync**: Changes sync when you're back online
- **Progressive Web App**: Install as a native app on your device
- **Local Storage**: All data cached locally using IndexedDB
- **Background Sync**: Seamless synchronization in the background

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google AI Studio account (for Gemini API)
- Modern browser with IndexedDB support (for offline functionality)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd glasslist
npm install
```

### 2. Set Up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database setup scripts** in the Supabase SQL editor:
   ```sql
   -- Run these files in order:
   -- 1. sql/01_create_tables.sql
   -- 2. sql/02_setup_rls.sql  
   -- 3. sql/03_functions_and_triggers.sql
   ```

3. **Enable Authentication** in Supabase Dashboard:
   - Go to Authentication → Settings
   - Enable Email authentication
   - Configure your site URL (e.g., `http://localhost:3000`)

4. **Set up Storage** (for image uploads):
   - Go to Storage → Create bucket → Name it `item-images`
   - Make it public for image serving

### 3. Get Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Copy the key (users will enter this in app settings)

### 4. Environment Variables

Create a `.env.local` file:
```bash
# Copy from .env.example and fill in your values
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Required for API key encryption (must be exactly 32 characters)
ENCRYPTION_KEY=your-32-character-secret-key-here
```

> **🔐 Security Note**: The `ENCRYPTION_KEY` is crucial for encrypting user API keys. Use a strong, random 32-character string. Never commit this to version control.

### 5. Run the Application
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your beautiful GlassList application!

## 📱 Pages Overview

### 🏠 **Landing Page** (`/`)
- Hero section with glassmorphism design
- Feature showcase
- Call-to-action buttons
- Responsive design

### 🔐 **Authentication** (`/auth`)
- Toggle between login/register
- Form validation
- Password visibility toggle
- Error handling

### 📊 **Dashboard** (`/dashboard`) - *Coming Soon*
- User analytics and insights
- Shopping lists grid
- "Create New List" functionality
- Recent activity

### 📝 **List View** (`/list/[listId]`) - *Coming Soon*
- Items grouped by category/aisle
- AI Quick Add input field
- Shopping mode toggle
- Item management (add, edit, delete, check off)

### ⚙️ **Settings** (`/settings`) - *Coming Soon*
- Profile management
- Gemini API key configuration
- App preferences
- Data export/import

## 🎨 Design System

### Color Palette
- **Primary**: `oklch(0.69 0.25 262.83)` - Purple
- **Secondary**: `oklch(0.71 0.25 328.36)` - Pink  
- **Accent**: `oklch(0.75 0.25 180.00)` - Cyan
- **Glassmorphism**: Semi-transparent whites with backdrop blur

### Components
- **Glass Cards**: `.glass-card` - Main container components
- **Glass Buttons**: `.glass-button` - Interactive elements
- **Glass Forms**: `.glass` - Input fields and form elements

### Typography
- **Font**: Inter (system fallback to ui-sans-serif)
- **Sizes**: Responsive typography scale
- **Colors**: High contrast for accessibility

## 🛠️ Technical Architecture

### Frontend
- **Next.js 15**: App Router, Server Components
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: CSS-first configuration
- **Lucide React**: Beautiful icons

### Backend
- **Supabase**: Database, Authentication, Storage
- **PostgreSQL**: Relational database with RLS
- **Row Level Security**: User data isolation

### Offline & PWA
- **IndexedDB**: Local data storage for offline functionality
- **Service Worker**: Background sync and caching
- **PWA Manifest**: Native app installation support
- **Background Sync**: Automatic data synchronization

### AI Integration
- **Google Gemini**: Natural language processing
- **Fallback Parser**: Basic parsing when AI unavailable
- **Personal API Keys**: Users provide their own keys

### Database Schema
```sql
-- Users extend Supabase auth.users
profiles: id, email, full_name, avatar_url, gemini_api_key

-- Shopping lists belong to users  
shopping_lists: id, user_id, name, description, is_archived

-- Items belong to lists
items: id, list_id, name, amount, unit, category, notes, image_url, is_checked
```

## 📦 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── list/              # Shopping list views
│   ├── settings/          # User settings
│   └── globals.css        # Tailwind + design system
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── auth/             # Auth-specific components
│   ├── dashboard/        # Dashboard components
│   ├── list/             # List management components
│   ├── ai/               # AI integration components
│   ├── upload/           # File upload components
│   └── offline/          # Offline mode components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client and types
│   ├── ai/               # AI integration (Gemini)
│   ├── offline/          # Offline storage and sync
│   └── utils/            # General utilities
├── public/               # Static assets
│   ├── sw.js            # Service worker
│   ├── manifest.json    # PWA manifest
│   └── offline.html     # Offline page
└── sql/                   # Database setup scripts
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📱 Offline Mode & PWA Features

### **How Offline Mode Works**
1. **Automatic Detection**: The app detects when you're offline and switches to offline mode
2. **Local Storage**: All your lists and items are stored locally using IndexedDB
3. **Offline Editing**: You can add, edit, and delete items while offline
4. **Sync Queue**: Changes are queued and sync automatically when you're back online
5. **Conflict Resolution**: Smart conflict resolution for simultaneous edits

### **PWA Installation**
- **Desktop**: Click the install prompt or use browser menu
- **Mobile**: Add to home screen from browser menu
- **Benefits**: Faster loading, offline access, native app experience

### **Offline Indicators**
- **Online Status**: Green indicator when connected
- **Offline Mode**: Orange indicator with pending changes count
- **Sync Status**: Yellow indicator when changes are pending sync
- **Error Handling**: Red indicator for sync errors with retry option

### **Offline Capabilities**
- ✅ View all shopping lists
- ✅ Add new items to lists
- ✅ Edit existing items
- ✅ Check/uncheck items
- ✅ Delete items
- ✅ Create new lists
- ✅ Search and filter items
- ✅ Shopping mode
- ✅ Export lists (when online)

### **Sync Behavior**
- **Automatic**: Syncs every 30 seconds when online
- **Manual**: Click "Sync Now" button to sync immediately
- **Retry Logic**: Failed syncs retry up to 3 times
- **Background**: Syncs happen in the background without interrupting your work

## 🚦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on each push

### Other Platforms
The app works on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 💡 Future Features

### Planned Enhancements
- [ ] **Progressive Web App**: Offline support and mobile installation
- [ ] **Collaborative Lists**: Share lists with family members
- [ ] **Barcode Scanner**: Add items by scanning barcodes
- [ ] **Recipe Integration**: Generate shopping lists from recipes
- [ ] **Store Maps**: Navigate stores efficiently
- [ ] **Price Tracking**: Track item prices over time
- [ ] **Smart Notifications**: Remind to buy frequently purchased items

### Technical Improvements
- [ ] **Real-time Updates**: Live sync across devices
- [ ] **Advanced Analytics**: More detailed shopping insights
- [ ] **Export Options**: PDF, CSV export capabilities
- [ ] **Accessibility**: Enhanced screen reader support
- [ ] **Performance**: Image optimization and lazy loading

## 📞 Support

- **Documentation**: Check this README and code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

---

**Made with ❤️ and ✨ glassmorphism magic**

*GlassList - Making shopping lists beautiful, one item at a time.*
