'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, LogOut, ShoppingCart } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'

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
        <Link href="/dashboard" className="flex items-center gap-2 text-glass-heading font-semibold">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">GlassList</span>
        </Link>
        
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