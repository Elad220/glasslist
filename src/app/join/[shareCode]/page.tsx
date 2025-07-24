'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Home
} from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getShoppingListByShareCode, joinListByShareCode, isDemoMode } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast/context'

// Mock data for demo mode
const mockListData = {
  id: '1',
  name: 'Weekly Groceries',
  description: 'Regular weekly shopping items for the Smith family',
  created_by: 'John Smith',
  member_count: 3,
  item_count: 12,
  created_at: '2024-01-15T10:00:00Z'
}

export default function JoinListPage() {
  const params = useParams()
  const router = useRouter()
  const shareCode = params.shareCode as string
  const toast = useToast()

  const [user, setUser] = useState<any>(null)
  const [listData, setListData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [joinStatus, setJoinStatus] = useState<'pending' | 'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isDemoMode) {
          // In real mode, check authentication and load list data
          const { user: currentUser } = await getCurrentUser()
          if (!currentUser) {
            // Redirect to auth with return URL
            router.push(`/auth?returnTo=${encodeURIComponent(`/join/${shareCode}`)}`)
            return
          }
          setUser(currentUser)
          
          // Load actual list data from Supabase using share code
          const { data: listData, error } = await getShoppingListByShareCode(shareCode)
          if (error || !listData) {
            setErrorMessage('Invalid or expired share link')
            setJoinStatus('error')
            setIsLoading(false)
            return
          }
          
          // Transform the data to match expected format
          setListData({
            id: listData.id,
            name: listData.name,
            description: listData.description,
            created_by: 'List Owner', // We could enhance this with actual user lookup
            member_count: Array.isArray(listData.list_members) ? listData.list_members.length : 0,
            item_count: Array.isArray(listData.items) ? listData.items.length : 0,
            created_at: listData.created_at
          })
        } else {
          // Use demo data
          setListData(mockListData)
        }
      } catch (error) {
        console.error('Error loading list data:', error)
        setErrorMessage('Invalid or expired share link')
        setJoinStatus('error')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [shareCode, router])

  const handleJoinList = async () => {
    if (!user) {
      router.push(`/auth?returnTo=${encodeURIComponent(`/join/${shareCode}`)}`)
      return
    }

    setIsJoining(true)
    setJoinStatus('pending')

    try {
      if (isDemoMode) {
        // Simulate joining in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        setJoinStatus('success')
        
        // Redirect to the list after a brief success message
        setTimeout(() => {
          router.push(`/list/${listData.id}`)
        }, 2000)
      } else {
        const { data: joinResult, error } = await joinListByShareCode(shareCode, user.id)
        
        if (error) {
          setErrorMessage(error)
          setJoinStatus('error')
        } else if (joinResult) {
          setJoinStatus('success')
          
          if (joinResult.already_member) {
            toast.success('Already a member', 'You are already a member of this list')
          } else {
            toast.success('Joined successfully', 'You have been added to the list')
          }
          
          setTimeout(() => {
            router.push(`/list/${joinResult.list_id}`)
          }, 2000)
        } else {
          setErrorMessage('Failed to join list')
          setJoinStatus('error')
        }
      }
    } catch (error) {
      console.error('Error joining list:', error)
      setErrorMessage('Failed to join list. Please try again.')
      setJoinStatus('error')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glass">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (joinStatus === 'error' || !listData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15"></div>
        </div>

        <div className="relative z-10 glass-card p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-glass-heading mb-4">Invalid Invitation</h2>
          <p className="text-glass-muted mb-6">
            {errorMessage || 'This share link is invalid, expired, or the list is no longer shared.'}
          </p>
          <div className="space-y-3">
            <Link 
              href="/dashboard" 
              className="glass-button w-full px-6 py-3 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
            <Link 
              href="/auth" 
              className="glass-button w-full px-6 py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (joinStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15"></div>
        </div>

        <div className="relative z-10 glass-card p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-glass-heading mb-4">Successfully Joined!</h2>
          <p className="text-glass-muted mb-6">
            You've been added to "{listData.name}". Redirecting you to the list...
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15"></div>
      </div>

      <div className="relative z-10 glass-card p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <ShoppingCart className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-glass-heading mb-2">Join Shopping List</h1>
          <p className="text-glass-muted">You've been invited to collaborate on a shopping list</p>
        </div>

        {/* List Info */}
        <div className="glass p-4 rounded-lg mb-6">
          <h3 className="text-lg font-bold text-glass-heading mb-2">{listData.name}</h3>
          {listData.description && (
            <p className="text-glass-muted mb-3">{listData.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-glass-muted">
                <Users className="w-4 h-4" />
                <span>{listData.member_count} members</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-glass-muted">
                <ShoppingCart className="w-4 h-4" />
                <span>{listData.item_count} items</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-glass-white-border">
            <p className="text-xs text-glass-muted">
              Created by {listData.created_by} • {new Date(listData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Join Actions */}
        <div className="space-y-3">
          {!user ? (
            <>
              <p className="text-sm text-glass-muted text-center mb-4">
                You need to sign in to join this list
              </p>
              <Link 
                href={`/auth?returnTo=${encodeURIComponent(`/join/${shareCode}`)}`}
                className="glass-button w-full px-6 py-3 flex items-center justify-center gap-2 bg-primary/20"
              >
                Sign In to Join
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={handleJoinList}
                disabled={isJoining}
                className="glass-button w-full px-6 py-3 flex items-center justify-center gap-2 bg-primary/20 disabled:opacity-50"
              >
                {isJoining ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    Join List
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {joinStatus === 'pending' && (
                <div className="glass p-3 rounded-lg text-center">
                  <p className="text-sm text-glass-muted">Adding you to the list...</p>
                </div>
              )}
            </>
          )}
          
          <Link 
            href="/dashboard" 
            className="glass-button w-full px-6 py-3 text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Share Code Display */}
        <div className="mt-6 pt-6 border-t border-glass-white-border text-center">
          <p className="text-xs text-glass-muted">Share Code</p>
          <p className="text-sm font-mono text-glass font-bold">{shareCode}</p>
        </div>
      </div>
    </div>
  )
} 