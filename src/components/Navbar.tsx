'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, Settings, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 p-4">
        <div className="glass-card flex items-center justify-between p-2 px-4 rounded-full">
          <Link href="/dashboard" className="flex items-center gap-2 text-glass-heading font-semibold">
            <ShoppingCart className="w-6 h-6 text-primary" />
            <span className="hidden sm:inline">GlassList</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 glass-button rounded-full"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full w-72 glass-card p-6 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-glass-heading">Menu</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 glass-button rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-3 rounded-lg text-glass-heading hover:bg-primary/10 transition-colors"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.label}</span>
              </Link>
            ))}
             <button
              onClick={handleSignOut}
              className="flex items-center gap-4 p-3 rounded-lg text-glass-heading hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

// Add ShoppingCart icon for the logo
import { ShoppingCart } from 'lucide-react'