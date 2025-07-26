'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { getShoppingLists } from '@/lib/supabase/client'

export default function SimpleDashboard() {
  const [user, setUser] = useState<any>(null)
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Step 1: Check auth
        const { user: currentUser, error: authError } = await getCurrentUser()
        
        if (authError || !currentUser) {
          router.push('/auth')
          return
        }

        setUser(currentUser)

        // Step 2: Fetch lists
        const { data: listsData, error: listsError } = await getShoppingLists(currentUser.id)
        
        if (listsError) {
          setError(`Lists error: ${listsError}`)
          return
        }

        setLists(listsData || [])
        
      } catch (err) {
        console.error('Simple Dashboard: Exception:', err)
        setError(`Exception: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <p>User ID: {user?.id}</p>
          <p>Email: {user?.email}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Shopping Lists ({lists.length})</h2>
          
          {lists.length === 0 ? (
            <p className="text-gray-500">No lists found</p>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <div key={list.id} className="p-3 border rounded">
                  <h3 className="font-medium">{list.name}</h3>
                  <p className="text-sm text-gray-600">{list.description}</p>
                  <p className="text-xs text-gray-400">Items: {list.items?.length || 0}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <a 
            href="/dashboard" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Try Full Dashboard
          </a>
        </div>
      </div>
    </div>
  )
} 