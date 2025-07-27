# Theme Feature Documentation

## Overview

The GlassList app now supports three theme modes:
- **Light Mode**: Bright and vibrant interface
- **Dark Mode**: Easy on the eyes, darker interface
- **System Mode**: Automatically follows your device's system preference

## Features

### Theme Persistence
- Theme selection is automatically saved to localStorage
- Your preference persists across browser sessions
- No need to re-select your theme each time you visit

### System Integration
- System mode automatically detects your device's dark/light mode preference
- Updates in real-time when you change your system theme
- Provides a seamless experience that matches your device settings

### Easy Access
- **Quick Toggle**: Click the theme icon in the navbar to cycle through themes
- **Settings Panel**: Full theme management in Settings → Appearance
- **Visual Feedback**: Icons change to show current theme (Sun, Moon, Monitor)

## Implementation Details

### Theme Context
The theme system is built using React Context (`src/lib/theme/context.tsx`):

```typescript
interface ThemeContextType {
  theme: ThemeMode          // Current theme setting
  setTheme: (theme: ThemeMode) => void  // Function to change theme
  resolvedTheme: 'light' | 'dark'       // Actual theme being applied
}
```

### CSS Variables
Themes are implemented using CSS custom properties:

```css
/* Light theme */
.light {
  --background: linear-gradient(/* light colors */);
  --foreground: var(--color-text-on-glass);
}

/* Dark theme */
.dark {
  --background: linear-gradient(/* dark colors */);
  --foreground: var(--color-text-light);
}
```

### Glassmorphism Support
All glass components automatically adapt to the current theme:
- Light theme: Uses light glass effects
- Dark theme: Uses dark glass effects
- Smooth transitions between themes

## Usage

### Via Navbar
1. Click the theme icon in the top navigation bar
2. The icon cycles through: Sun (Light) → Moon (Dark) → Monitor (System)
3. The theme changes immediately

### Via Settings
1. Go to Settings → Appearance
2. Choose from three theme options with visual previews
3. See the current theme status and preview

### System Mode Details
When using System mode:
- The app automatically detects your device's theme preference
- Changes when you switch your device between light and dark mode
- Shows the current resolved theme (e.g., "System (Dark)")

## Technical Notes

### Browser Support
- Requires localStorage support for theme persistence
- Uses CSS custom properties for theming
- Supports modern browsers with backdrop-filter support

### Performance
- Theme changes are instant with smooth transitions
- No page reload required
- Minimal performance impact

### Accessibility
- High contrast ratios maintained in both themes
- Proper text shadows for readability
- Keyboard navigation support

## Future Enhancements

Potential improvements for the theme system:
- Custom color schemes
- Theme-specific animations
- User-defined color preferences
- Automatic theme scheduling