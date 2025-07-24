'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Plus, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  Edit,
  Save,
  Trash2,
  Share2,
  Globe,
  Lock
} from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/supabase/auth'
import { useToast } from '@/lib/toast/context'
import { 
  getShoppingLists, 
  updateShoppingList, 
  deleteShoppingList, 
  getUserAnalytics,
  isDemoMode 
} from '@/lib/supabase/client'
import type { ShoppingList } from '@/lib/supabase/types'

const mockAnalytics = {
  total_lists: 3,
  total_items: 24,
  completed_items: 18,
  items_this_month: 15,
  most_frequent_category: 'Produce',
  most_frequent_items: [
    { name: 'Milk', count: 8 },
    { name: 'Bread', count: 6 },
    { name: 'Eggs', count: 5 },
    { name: 'Apples', count: 4 },
    { name: 'Bananas', count: 3 }
  ]
}

const mockShoppingLists = [
  {
    id: '1',
    name: 'Weekly Groceries',
    description: 'Regular weekly shopping items',
    itemCount: 12,
    completedCount: 8,
    is_shared: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    name: 'Party Supplies',
    description: 'Items for weekend party',
    itemCount: 8,
    completedCount: 3,
    is_shared: false,
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Holiday Dinner',
    description: 'Special ingredients for holiday meal',
    itemCount: 15,
    completedCount: 15,
    is_shared: true,
    created_at: '2024-01-10T09:15:00Z'
  }
]

// Helper to check if a list is a mock list (demo mode)
function isMockList(list: any): list is { itemCount: number; completedCount: number } {
  return (
    typeof list.itemCount === 'number' && typeof list.completedCount === 'number'
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [analytics, setAnalytics] = useState(mockAnalytics)
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditList, setShowEditList] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [listToDelete, setListToDelete] = useState<any>(null)
  const router = useRouter()
  const toast = useToast()
  
  // Edit form state
  const [editListForm, setEditListForm] = useState({
    name: '',
    description: '',
    is_shared: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const fetchShoppingLists = async (userId: string) => {
    console.log('Dashboard: fetchShoppingLists called with userId:', userId)
    try {
      console.log('Dashboard: About to call getShoppingLists...')
      const { data, error } = await getShoppingLists(userId)
      console.log('Dashboard: getShoppingLists returned:', { data, error })
      
      if (error) {
        console.error('Dashboard: Shopping lists fetch error:', error)
        toast.error('Data loading failed', 'Unable to load your shopping lists. Please try refreshing the page.')
        // Fallback to empty array so the UI doesn't break
        setShoppingLists([])
        return
      }
      
      if (data) {
        console.log('Dashboard: Processing data, count:', data.length)
        // Transform data to include item counts
        const listsWithCounts = data.map((list: any) => {
          console.log('Dashboard: Processing list:', list.id, list.name)
          return {
            ...list,
            itemCount: list.items?.length || 0,
            completedCount: list.items?.filter((item: any) => item.is_checked)?.length || 0
          }
        })
        console.log('Dashboard: Setting shopping lists:', listsWithCounts)
        setShoppingLists(listsWithCounts)
      }
    } catch (error) {
      console.error('Dashboard: Unexpected error fetching shopping lists:', error)
      toast.error('Unexpected error', 'Something went wrong loading your data.')
      setShoppingLists([])
    }
  }

  const fetchAnalytics = async (userId: string) => {
    console.log('Dashboard: fetchAnalytics called with userId:', userId)
    try {
      console.log('Dashboard: About to call getUserAnalytics...')
      const { data, error } = await getUserAnalytics(userId)
      console.log('Dashboard: getUserAnalytics returned:', { data, error })
      
      if (error) {
        console.error('Dashboard: Analytics fetch error:', error)
        // Fallback to mock analytics if function doesn't exist or fails
        console.log('Dashboard: Using mock analytics due to error')
        setAnalytics(mockAnalytics)
      } else if (data) {
        console.log('Dashboard: Setting real analytics data')
        setAnalytics(data)
      } else {
        console.log('Dashboard: No analytics data, using mock')
        setAnalytics(mockAnalytics)
      }
    } catch (error) {
      console.error('Dashboard: Unexpected error fetching analytics:', error)
      console.log('Dashboard: Using mock analytics due to exception')
      setAnalytics(mockAnalytics)
    }
  }

  const checkAuth = async () => {
    console.log('Dashboard: checkAuth called')
    try {
      console.log('Dashboard: Getting current user...')
      const { user, error } = await getCurrentUser()
      console.log('Dashboard: getCurrentUser returned:', { user: user?.id, error })
      
      if (error || !user) {
        console.log('Dashboard: No user found, redirecting to auth')
        router.push('/auth')
        return
      }

      console.log('Dashboard: Setting user:', user.id)
      setUser(user)
      
      if (!isDemoMode) {
        console.log('Dashboard: Not in demo mode, fetching real data...')
        await Promise.all([
          fetchShoppingLists(user.id),
          fetchAnalytics(user.id)
        ])
        console.log('Dashboard: Data fetching completed')
      } else {
        console.log('Dashboard: In demo mode, using mock data')
        setShoppingLists(mockShoppingLists as unknown as ShoppingList[])
        setAnalytics(mockAnalytics)
      }
    } catch (error) {
      console.error('Dashboard: Auth check failed:', error)
      router.push('/auth')
    } finally {
      console.log('Dashboard: Setting loading to false')
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getCompletionPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const handleEditList = (list: any, event: React.MouseEvent) => {
    event.preventDefault() // Prevent navigation to list view
    event.stopPropagation()
    setEditingList(list)
    setEditListForm({
      name: list.name || '',
      description: list.description || '',
      is_shared: list.is_shared || false
    })
    setShowEditList(true)
  }

  const handleSaveList = async () => {
    if (!editListForm.name.trim() || !editingList) return

    try {
      if (isDemoMode) {
        // Simulate saving in demo mode
        await new Promise(resolve => setTimeout(resolve, 500))
        setShoppingLists(lists => 
          lists.map(list => 
            list.id === editingList.id 
              ? { ...list, ...editListForm, updated_at: new Date().toISOString() }
              : list
          )
        )
      } else {
        const { data: updatedList, error } = await updateShoppingList(editingList.id, editListForm)
        if (error || !updatedList) {
          toast.error('Update failed', 'Failed to update list. Please try again.')
          return
        }
        
        setShoppingLists(lists => 
          lists.map(list => 
            list.id === editingList.id 
              ? { ...list, ...updatedList }
              : list
          )
        )
      }
      
      setShowEditList(false)
      setEditingList(null)
      toast.success('List updated', `${editListForm.name} has been updated`)
    } catch (error) {
      console.error('Error updating list:', error)
      toast.error('Update failed', 'Failed to update list. Please try again.')
    }
  }

  const handleDeleteList = (list: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setListToDelete(list)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteList = async () => {
    if (!listToDelete) return

    try {
      if (isDemoMode) {
        // Simulate deletion in demo mode
        await new Promise(resolve => setTimeout(resolve, 500))
        setShoppingLists(lists => lists.filter(list => list.id !== listToDelete.id))
      } else {
        const { error } = await deleteShoppingList(listToDelete.id)
        if (error) {
          toast.error('Delete failed', 'Failed to delete list. Please try again.')
          return
        }
        
        setShoppingLists(lists => lists.filter(list => list.id !== listToDelete.id))
      }
      
      toast.success('List deleted', `${listToDelete.name} has been deleted`)
      setShowDeleteConfirm(false)
      setListToDelete(null)
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Delete failed', 'Failed to delete list. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glass">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-glass-heading">
                  Welcome back{isDemoMode ? ', Demo User' : (user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : '')}!
                </h1>
                <p className="text-glass-muted">Here's your shopping overview</p>
                {isDemoMode && (
                  <p className="text-blue-600 text-sm mt-1 font-semibold">✨ Demo Mode - Explore the beautiful interface!</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/settings" className="glass-button p-3">
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleSignOut}
                className="glass-button p-3 hover:bg-red-100/20"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6 text-center">
            <Package className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-glass-heading">{analytics.total_lists}</p>
            <p className="text-glass-muted text-sm">Shopping Lists</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <ShoppingCart className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-glass-heading">{analytics.total_items}</p>
            <p className="text-glass-muted text-sm">Total Items</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-glass-heading">{analytics.completed_items}</p>
            <p className="text-glass-muted text-sm">Completed</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-glass-heading">{analytics.items_this_month}</p>
            <p className="text-glass-muted text-sm">This Month</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shopping Lists */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-glass-heading">
                  <ShoppingCart className="w-5 h-5" />
                  Your Shopping Lists
                </h2>
                <Link 
                  href="/list/new"
                  className="glass-button px-4 py-2 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New List
                </Link>
              </div>

              <div className="space-y-4">
                {shoppingLists.map((list) => (
                  <div
                    key={list.id}
                    className="glass-card p-4 hover:scale-[1.02] transition-all duration-200 relative group"
                  >
                    <Link
                      href={`/list/${list.id}`}
                      className="block"
                    >
                      <div className="pr-20">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-glass-heading">{list.name}</h3>
                          {list.is_shared && (
                            <div className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              <Share2 className="w-3 h-3" />
                              Shared
                            </div>
                          )}
                        </div>
                        <p className="text-glass-muted text-sm mb-3">{list.description}</p>
                        <div className="flex items-center gap-4 text-xs text-glass-muted mb-3">
                          <span>{isDemoMode && isMockList(list) ? list.itemCount : 0} items</span>
                          <span>{isDemoMode && isMockList(list) ? list.completedCount : 0} completed</span>
                          <span>{formatDate(list.created_at)}</span>
                        </div>
                        
                        {/* Progress Bar - Moved down */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full h-2 bg-glass-white-light rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ 
                                  width: `${getCompletionPercentage(
                                    isDemoMode && isMockList(list) ? list.completedCount : 0,
                                    isDemoMode && isMockList(list) ? list.itemCount : 0
                                  )}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-primary">
                            {getCompletionPercentage(
                              isDemoMode && isMockList(list) ? list.completedCount : 0,
                              isDemoMode && isMockList(list) ? list.itemCount : 0
                            )}%
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={(e) => handleEditList(list, e)}
                        className="p-2 glass-button hover:bg-primary/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm"
                        title="Edit list"
                      >
                        <Edit className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteList(list, e)}
                        className="p-2 glass-button hover:bg-red-500/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm border border-red-200/30"
                        title="Delete list"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-glass-heading">
                <BarChart3 className="w-5 h-5" />
                Quick Insights
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-glass-muted">Most shopped category</p>
                  <p className="font-semibold text-primary">{analytics.most_frequent_category}</p>
                </div>
                
                <div>
                  <p className="text-sm text-glass-muted mb-2">Top items</p>
                  <div className="space-y-1">
                    {analytics.most_frequent_items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-glass">{item.name}</span>
                        <span className="text-glass-muted">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 text-glass-heading">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href="/list/new"
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Create New List
                </Link>
                
                <Link 
                  href="/settings"
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit List Modal */}
      {showEditList && editingList && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setShowEditList(false)
            setEditingList(null)
          }}
        >
          <div 
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit List
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-2">List Name</label>
                <input
                  type="text"
                  value={editListForm.name}
                  onChange={(e) => setEditListForm({ ...editListForm, name: e.target.value })}
                  className="w-full glass border-0 rounded-lg px-4 py-2 text-glass placeholder-glass-muted"
                  placeholder="Enter list name"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-glass-muted mb-2">Description</label>
                <textarea
                  value={editListForm.description}
                  onChange={(e) => setEditListForm({ ...editListForm, description: e.target.value })}
                  className="w-full glass border-0 rounded-lg px-4 py-2 text-glass placeholder-glass-muted resize-none"
                  placeholder="Optional description"
                  rows={3}
                  maxLength={500}
                />
              </div>
              
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editListForm.is_shared}
                    onChange={(e) => setEditListForm({ ...editListForm, is_shared: e.target.checked })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-glass">Enable sharing</span>
                </label>
                <p className="text-xs text-glass-muted mt-1">
                  Allow others to access this list via share link
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleSaveList}
                disabled={!editListForm.name.trim()}
                className="glass-button px-4 py-2 bg-primary/20 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button 
                onClick={() => {
                  setShowEditList(false)
                  setEditingList(null)
                }}
                className="glass-button px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && listToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setShowDeleteConfirm(false)
            setListToDelete(null)
          }}
        >
          <div 
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-glass-heading">Delete Shopping List</h3>
                <p className="text-glass-muted text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-glass">
                Are you sure you want to delete <strong>"{listToDelete.name}"</strong>?
              </p>
              <p className="text-glass-muted text-sm mt-2">
                This will permanently remove the list and all {listToDelete.itemCount} items in it.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmDeleteList}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30 px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete List
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setListToDelete(null)
                }}
                className="flex-1 glass-button px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 