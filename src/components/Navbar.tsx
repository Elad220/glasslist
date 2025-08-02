'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, ShoppingCart, WifiOff, RefreshCw, Upload, CheckCircle, X, Sun, Moon, Monitor } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useSyncStatus, useOnlineStatus, usePendingChanges } from '@/lib/offline/hooks'
import { useTheme } from '@/lib/theme/context'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-10 p-4 animate-slide-down">
      <div className="glass-premium flex items-center justify-between p-2 px-4 rounded-full hover-lift animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-glass-heading font-semibold group">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 text-primary group-hover:animate-wave" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="hidden sm:inline gradient-text animate-gradient">GlassList</span>
          </Link>
          <SyncPopover />
        </div>
        
        {/* Navigation Items */}
        <nav className="flex items-center gap-1">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-glass-heading hover:bg-primary/10 hover:text-primary hover:border hover:border-primary/20'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-glass-heading hover:bg-primary/10 hover:text-primary hover:border hover:border-primary/20 transition-all duration-300"
              title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
            >
              {theme === 'light' && <Sun className="w-4 h-4" />}
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
              <span className="hidden lg:inline">Theme</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-glass-heading hover:bg-error/10 hover:text-error hover:border hover:border-error/20 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
          
          {/* Mobile Navigation - Icon Only */}
          <div className="flex md:hidden items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-full transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-glass-heading hover:bg-primary/10 hover:text-primary hover:border hover:border-primary/20'
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-full text-glass-heading hover:bg-primary/10 hover:text-primary hover:border hover:border-primary/20 transition-all duration-300"
              title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'system' && <Monitor className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-glass-heading hover:bg-error/10 hover:text-error hover:border hover:border-error/20 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

function SyncPopover() {
  const [showDetails, setShowDetails] = useState(false)
  const isOnline = useOnlineStatus()
  const { syncing, pendingChanges } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  
  const getStatusColor = () => {
    if (!isOnline) return 'text-error'
    if (syncing) return 'text-info'
    if (pendingCount > 0) return 'text-warning'
    return 'text-success'
  }

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff
    if (syncing) return RefreshCw
    if (pendingCount > 0) return Upload
    return CheckCircle
  }

  const formatLastSync = () => {
    // Implementation would be similar to OfflineIndicator
    return 'Just now'
  }

  const Icon = getStatusIcon()

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
          showDetails ? 'bg-primary/20 border border-primary/30' : 'hover:bg-primary/10'
        }`}
      >
        <Icon className={`w-4 h-4 ${getStatusColor()} ${syncing ? 'animate-spin' : ''}`} />
      </button>

      {showDetails && (
        <div className="absolute top-full right-0 mt-2 glass-card p-3 rounded-lg border border-glass-white-border backdrop-blur-md animate-slide-up min-w-48">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-glass-muted">Status:</span>
              <span className={getStatusColor()}>
                {!isOnline ? 'Offline' : syncing ? 'Syncing' : pendingCount > 0 ? `${pendingCount} Pending` : 'Synced'}
              </span>
            </div>
            
            {pendingCount > 0 && (
              <div className="flex justify-between">
                <span className="text-glass-muted">Pending:</span>
                <span className="text-warning">{pendingCount}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-glass-muted">Last sync:</span>
              <span className="text-glass-muted">{formatLastSync()}</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-2 text-glass-muted hover:text-glass-heading transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}