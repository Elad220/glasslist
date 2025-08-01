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
    <header className="sticky top-0 z-40 p-4 animate-slide-down">
      <div className="glass-premium flex items-center justify-between p-2 px-4 rounded-full hover-lift animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-glass-heading font-semibold group">
            <ShoppingCart className="w-6 h-6 text-primary group-hover:animate-wave" />
            <span className="hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">GlassList</span>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-primary/20 text-primary'
                    : 'text-glass-heading hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-glass-heading hover:bg-primary/10 hover:text-primary transition-all duration-200"
              title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
            >
              {theme === 'light' && <Sun className="w-4 h-4" />}
              {theme === 'dark' && <Moon className="w-4 h-4" />}
              {theme === 'system' && <Monitor className="w-4 h-4" />}
              <span className="hidden lg:inline">Theme</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-glass-heading hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
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
                className={`p-2 rounded-full transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-primary/20 text-primary'
                    : 'text-glass-heading hover:bg-primary/10 hover:text-primary'
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-full text-glass-heading hover:bg-primary/10 hover:text-primary transition-all duration-200"
              title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
            >
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'system' && <Monitor className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-glass-heading hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
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
  const isOnline = useOnlineStatus()
  const { syncing, lastSync, errors, forceSync } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  const [open, setOpen] = useState(false)

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400'
    if (syncing) return 'text-blue-400'
    if (pendingCount > 0) return 'text-orange-400'
    return 'text-green-400'
  }

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff
    if (syncing) return RefreshCw
    if (pendingCount > 0) return Upload
    return CheckCircle
  }

  const Icon = getStatusIcon()

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    const date = new Date(lastSync)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 p-1 bg-white/10 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary"
        title="Sync Status"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open sync status"
        type="button"
      >
        <Icon className={`w-4 h-4 ${getStatusColor()} ${syncing ? 'animate-spin' : ''}`} />
        {pendingCount > 0 && (
          <span className="text-xs text-orange-400 font-medium">{pendingCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 min-w-[260px] max-w-xs bg-black/80 border border-white/30 rounded-lg shadow-xl backdrop-blur-md z-20 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Sync Status</span>
            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-white" aria-label="Close sync status">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-200">Connection:</span>
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-200">Sync Status:</span>
              <span className={syncing ? 'text-blue-400' : 'text-green-400'}>
                {syncing ? 'Syncing...' : 'Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-200">Pending Changes:</span>
              <span className="text-orange-400">{pendingCount}</span>
            </div>
            {lastSync && (
              <div className="flex justify-between">
                <span className="text-gray-200">Last Sync:</span>
                <span className="text-gray-200">{formatLastSync()}</span>
              </div>
            )}
            {errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-500/30 border border-red-500/50 rounded">
                <div className="text-red-300 text-xs font-medium mb-1">Errors:</div>
                {errors.map((error, index) => (
                  <div key={index} className="text-red-200 text-xs">{error}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => forceSync()}
              disabled={syncing || !isOnline}
              className="flex-1 px-3 py-1.5 text-xs bg-blue-500/30 border border-blue-500/50 text-blue-200 rounded hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}