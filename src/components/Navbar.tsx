'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, ShoppingCart, WifiOff, RefreshCw, Upload, X, CheckCircle } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'
import { CompactOfflineIndicator, useSyncStatus, useOnlineStatus, usePendingChanges } from './OfflineIndicator'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="glass-card flex items-center justify-between p-2 px-4 rounded-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-glass-heading font-semibold">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="hidden sm:inline">GlassList</span>
          </Link>
          <SyncPopover className="hidden sm:flex" />
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

function SyncPopover({ className = '' }: { className?: string }) {
  const isOnline = useOnlineStatus()
  const { syncing, lastSync, errors, forceSync } = useSyncStatus()
  const { pendingCount } = usePendingChanges()
  const [open, setOpen] = useState(false)

  // Status logic (reuse from CompactOfflineIndicator)
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
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className={`flex items-center gap-1 focus:outline-none ${className}`} title="Sync Status">
          <Icon className={`w-4 h-4 ${getStatusColor()} ${syncing ? 'animate-spin' : ''}`} />
          {pendingCount > 0 && (
            <span className="text-xs text-orange-400 font-medium">{pendingCount}</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 w-72 glass-card p-4 rounded-lg border border-white/20 backdrop-blur-md shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-glass-heading">Sync Status</span>
              <Popover.Close className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></Popover.Close>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Connection:</span>
                <span className={isOnline ? 'text-green-400' : 'text-red-400'}>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sync Status:</span>
                <span className={syncing ? 'text-blue-400' : 'text-green-400'}>{syncing ? 'Syncing...' : 'Idle'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Pending Changes:</span>
                <span className="text-orange-400">{pendingCount}</span>
              </div>
              {lastSync && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Last Sync:</span>
                  <span className="text-gray-300">{formatLastSync()}</span>
                </div>
              )}
              {errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded">
                  <div className="text-red-400 text-xs font-medium mb-1">Errors:</div>
                  {errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-xs">{error}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={forceSync}
                disabled={syncing || !isOnline}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? 'Syncing...' : 'Force Sync'}
              </button>
            </div>
          </div>
          <Popover.Arrow className="fill-white/20" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}