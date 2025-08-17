'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Plus, 
  BarChart3, 
  User,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  Edit,
  Save,
  Trash2,
  Globe,
  Lock,
  Search,
  Settings,
  Download,
  Upload,
  Sparkles,
  BookOpen,
  Filter,
  Zap,
  Copy,
  HelpCircle,
  X
} from 'lucide-react'

import { getCurrentUser, getProfile } from '@/lib/supabase/auth'
import type { Profile } from '@/lib/supabase/types'
import { useToast } from '@/lib/toast/context'
import { 
  getShoppingLists, 
  updateShoppingList, 
  deleteShoppingList, 
  getUserAnalytics,
  getListItems,
  isDemoMode 
} from '@/lib/supabase/client'
import { undoManager, createDeleteListUndoAction } from '@/lib/undo-redo/simple'
import type { ShoppingList, ShoppingListWithCounts } from '@/lib/supabase/types'
import AISuggestions from '@/components/AISuggestions'
import GenAIInsights from '@/components/GenAIInsights'
import SmartShoppingTips from '@/components/SmartShoppingTips'
import AIShoppingAnalytics from '@/components/AIShoppingAnalytics'

const mockProfile: Profile = {
  id: 'demo-user-123',
  email: 'demo@glasslist.com',
  full_name: 'Demo User',
  avatar_url: null,
  gemini_api_key: null,
  ai_auto_populate_enabled: true,
  ai_quick_add_enabled: true,
  ai_voice_enabled: true,
  ai_suggestions_enabled: true,
  ai_analytics_enabled: true,
  ai_tips_enabled: true,
  ai_insights_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

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
  ],
  // Add any missing properties that might be expected
  completion_rate: 75,
  shopping_frequency: 'weekly',
  average_items_per_trip: 8
}

const mockShoppingLists = [
  {
    id: '1',
    name: 'Weekly Groceries',
    description: 'Regular weekly shopping items',
    itemCount: 12,
    completedCount: 8,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user_id: 'demo-user-123',
    is_archived: false
  },
  {
    id: '2', 
    name: 'Party Supplies',
    description: 'Items for weekend party',
    itemCount: 8,
    completedCount: 3,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    user_id: 'demo-user-123',
    is_archived: false
  },
  {
    id: '3',
    name: 'Holiday Dinner',
    description: 'Special ingredients for holiday meal',
    itemCount: 15,
    completedCount: 15,
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-10T09:15:00Z',
    user_id: 'demo-user-123',
    is_archived: false
  }
]

// Quick list templates
const listTemplates = [
  {
    name: 'Weekly Groceries',
    description: 'Essential weekly shopping items',
    items: ['Milk', 'Bread', 'Eggs', 'Chicken', 'Rice', 'Vegetables', 'Fruits', 'Yogurt']
  },
  {
    name: 'Party Essentials',
    description: 'Everything you need for a great party',
    items: ['Chips', 'Soda', 'Pizza', 'Napkins', 'Cups', 'Ice', 'Decorations', 'Music playlist']
  },
  {
    name: 'Healthy Meal Prep',
    description: 'Ingredients for a week of healthy meals',
    items: ['Quinoa', 'Salmon', 'Broccoli', 'Sweet potatoes', 'Spinach', 'Greek yogurt', 'Almonds', 'Olive oil']
  },
  {
    name: 'Breakfast Basics',
    description: 'Start your day right',
    items: ['Oatmeal', 'Bananas', 'Coffee', 'Orange juice', 'Cereal', 'Bagels', 'Cream cheese', 'Honey']
  },
  {
    name: 'BBQ & Grill',
    description: 'Perfect for outdoor cooking',
    items: ['Burgers', 'Hot dogs', 'BBQ sauce', 'Charcoal', 'Corn', 'Watermelon', 'Beer', 'Aluminum foil']
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
  const [profile, setProfile] = useState<any>(null)
  const [analytics, setAnalytics] = useState(mockAnalytics)
  const [shoppingLists, setShoppingLists] = useState<ShoppingListWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditList, setShowEditList] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [listToDelete, setListToDelete] = useState<any>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(false)
  const router = useRouter()
  const toast = useToast()

  
  // Edit form state
  const [editListForm, setEditListForm] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  // Refresh lists when the page gains focus (e.g., when navigating back)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !isDemoMode) {
        console.log('Dashboard: Page gained focus, refreshing lists...')
        fetchShoppingLists(user.id)
      }
    }

    // Listen for focus events
    window.addEventListener('focus', handleFocus)
    
    // Also refresh when the page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !isDemoMode) {
        console.log('Dashboard: Page became visible, refreshing lists...')
        fetchShoppingLists(user.id)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, isDemoMode])

  const fetchShoppingLists = async (userId: string) => {
    try {
      const { data, error } = await getShoppingLists(userId)
      
      if (error) {
        console.error('Dashboard: Shopping lists fetch error:', error)
        toast.error('Data loading failed', 'Unable to load your shopping lists. Please try refreshing the page.')
        // Fallback to empty array so the UI doesn't break
        setShoppingLists([])
        return
      }
      
      if (data) {
        // Transform data to include item counts
        const listsWithCounts: ShoppingListWithCounts[] = data.map((list: any) => {
          return {
            ...list,
            itemCount: list.items?.length || 0,
            completedCount: list.items?.filter((item: any) => item.is_checked)?.length || 0
          }
        })
        
        // Debug: Log lists before sorting
        console.log('Dashboard: Lists before sorting:', listsWithCounts.map(l => ({
          name: l.name,
          updated_at: l.updated_at,
          date: new Date(l.updated_at).toLocaleString()
        })))
        
        // Sort lists by updated_at in descending order (most recent first)
        listsWithCounts.sort((a, b) => {
          const dateA = new Date(a.updated_at).getTime()
          const dateB = new Date(b.updated_at).getTime()
          return dateB - dateA
        })
        
        // Debug: Log lists after sorting
        console.log('Dashboard: Lists after sorting:', listsWithCounts.map(l => ({
          name: l.name,
          updated_at: l.updated_at,
          date: new Date(l.updated_at).toLocaleString()
        })))
        
        setShoppingLists(listsWithCounts)
      }
    } catch (error) {
      console.error('Dashboard: Unexpected error fetching shopping lists:', error)
      toast.error('Unexpected error', 'Something went wrong loading your data.')
      setShoppingLists([])
    }
  }

  const fetchAnalytics = async (userId: string) => {
    try {
      const { data, error } = await getUserAnalytics(userId)
      
      if (error) {
        console.error('Dashboard: Analytics fetch error:', error)
        // Fallback to mock analytics if function doesn't exist or fails
        setAnalytics(mockAnalytics)
      } else if (data) {
        setAnalytics(data)
      } else {
        setAnalytics(mockAnalytics)
      }
    } catch (error) {
      console.error('Dashboard: Unexpected error fetching analytics:', error)
      setAnalytics(mockAnalytics)
    }
  }

  const checkAuth = async () => {
    try {
      const { user, error } = await getCurrentUser()
      
      if (error || !user) {
        router.push('/auth')
        return
      }

      setUser(user)
      
      if (!isDemoMode) {
        // Fetch profile to get the decrypted API key
        const { profile: userProfile } = await getProfile(user.id)
        setProfile(userProfile)
        
        await Promise.all([
          fetchShoppingLists(user.id),
          fetchAnalytics(user.id)
        ])
      } else {
        setProfile(mockProfile)
        setShoppingLists(mockShoppingLists as unknown as ShoppingListWithCounts[])
        setAnalytics(mockAnalytics)
      }
    } catch (error) {
      console.error('Dashboard: Auth check failed:', error)
      router.push('/auth')
    } finally {
      setIsLoading(false)
    }
  }

  

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getCompletionPercentage = (completed: number, total: number) => {
    const completedNum = Number(completed) || 0
    const totalNum = Number(total) || 0
    return totalNum > 0 ? Math.round((completedNum / totalNum) * 100) : 0
  }

  const handleEditList = (list: any, event: React.MouseEvent) => {
    event.preventDefault() // Prevent navigation to list view
    event.stopPropagation()
    setEditingList(list)
    setEditListForm({
      name: list?.name || '',
      description: list?.description || '',
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
      toast.success('List updated', `${editListForm.name || 'List'} has been updated`)
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
      // Create undo action
      const undoActionData = createDeleteListUndoAction(listToDelete, () => {
        // Refresh the lists after undo
        if (user) {
          fetchShoppingLists(user.id)
        }
      })
      const undoAction = undoManager.addAction(undoActionData)

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
      
      // Show toast with undo button
      toast.success(
        'List deleted', 
        `${listToDelete?.name || 'List'} has been deleted`,
        {
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                const latestAction = undoManager.getLatestAction()
                if (latestAction && latestAction.id === undoAction.id) {
                  await latestAction.execute()
                  undoManager.removeAction(latestAction.id)
                  toast.success('Undone', `${listToDelete?.name || 'List'} has been restored`)
                }
              } catch (error) {
                console.error('Error undoing action:', error)
                toast.error('Undo failed', 'Failed to restore the list')
              }
            }
          }
        }
      )
      
      setShowDeleteConfirm(false)
      setListToDelete(null)
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Delete failed', 'Failed to delete list. Please try again.')
    }
  }

  const handleSearchLists = () => {
    setShowSearchModal(true)
  }


  const handleCreateFromTemplate = async (template: typeof listTemplates[0]) => {
    try {
      if (isDemoMode) {
        // Simulate creating from template
        await new Promise(resolve => setTimeout(resolve, 500))
        toast.success('Template created!', `${template.name} list has been created`)
        setShowTemplatesModal(false)
        // In real app, would create the list and redirect
      } else {
        // Real implementation would create the list
        router.push(`/list/new?template=${encodeURIComponent(template.name)}`)
      }
    } catch (error) {
      console.error('Error creating from template:', error)
      toast.error('Creation failed', 'Unable to create list from template')
    }
  }

  const handleExportData = async () => {
    try {
      // For demo mode, use existing data
      if (isDemoMode) {
        const exportData = {
          lists: shoppingLists,
          analytics: analytics,
          exportDate: new Date().toISOString()
        }
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json; charset=utf-8' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `glasslist-data-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Data exported', 'Your shopping lists have been exported successfully')
        return
      }

      // For real mode, fetch items for all lists
      const listsWithItems = await Promise.all(
        shoppingLists.map(async (list) => {
          const { data: itemsData, error: itemsError } = await getListItems(list.id)
          if (itemsError) {
            console.error(`Error fetching items for list ${list.id}:`, itemsError)
            return { ...list, items: [] }
          }
          return { ...list, items: itemsData || [] }
        })
      )

      const exportData = {
        lists: listsWithItems,
        analytics: analytics || {},
        exportDate: new Date().toISOString()
      }
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json; charset=utf-8' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `glasslist-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported', 'Your shopping lists have been exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Export failed', 'Unable to export your data')
    }
  }

  const getFilteredLists = () => {
    if (!Array.isArray(shoppingLists)) return []
    if (!searchQuery.trim()) return shoppingLists
    return shoppingLists.filter(list => 
      list?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleExportSingleList = async (list: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      let items = []
      
      if (isDemoMode && isMockList(list)) {
        // For demo mode, create mock export data
        items = Array.from({ length: list?.itemCount || 0 }, (_, i) => ({
          name: `Item ${i + 1}`,
          amount: 1,
          unit: 'pcs',
          category: 'Other',
          notes: '',
          is_checked: i < (list?.completedCount || 0),
          image_url: null
        }))
      } else {
        // For real mode, fetch actual items
        const { data: itemsData, error: itemsError } = await getListItems(list.id)
        if (itemsError) {
          console.error('Error fetching items for export:', itemsError)
          toast.error('Export failed', 'Unable to fetch list items')
          return
        }
        items = itemsData || []
      }

      const exportData = {
        list: {
          name: list?.name || 'Unknown List',
          description: list?.description || '',
              created_at: list?.created_at || new Date().toISOString()
        },
        items: items,
        exportDate: new Date().toISOString(),
        exportType: 'single-list'
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json; charset=utf-8' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      // Create a safe filename that preserves Hebrew characters but removes problematic ones
      const safeName = (list?.name || 'Unknown List')
        .replace(/[<>:"/\\|?*]/g, '_') // Remove Windows filename invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50) // Limit length
      link.download = `${safeName}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('List exported', `${list?.name || 'List'} has been exported successfully`)
    } catch (error) {
      console.error('Error exporting list:', error)
      toast.error('Export failed', 'Unable to export the list')
    }
  }

  const handleImportData = async () => {
    if (!importFile) {
      toast.error('No file selected', 'Please select a file to import')
      return
    }

    setImportProgress(true)

    try {
      const fileContent = await importFile.text()
      const importData = JSON.parse(fileContent)

      // Validate the imported data structure
      if (!importData.lists || !Array.isArray(importData.lists)) {
        throw new Error('Invalid file format: Missing or invalid lists array')
      }

      const validLists = importData.lists.filter((list: any) => 
        list.name && typeof list.name === 'string'
      )

      if (validLists.length === 0) {
        throw new Error('No valid lists found in the imported file')
      }

      if (isDemoMode) {
        // Simulate import in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Add imported lists to the existing ones
        const newLists = validLists.map((list: any, index: number) => ({
          ...list,
          id: `imported-${Date.now()}-${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          itemCount: list?.items?.length || list?.itemCount || 0,
          completedCount: list?.items?.filter((item: any) => item?.is_checked)?.length || list?.completedCount || 0
        }))

        setShoppingLists(prevLists => [...prevLists, ...newLists])
        toast.success(
          'Import successful!', 
          `Successfully imported ${validLists.length} shopping list${validLists.length > 1 ? 's' : ''}`
        )
      } else {
        // Real implementation would handle actual data import
        toast.info(
          'Import ready', 
          `Found ${validLists.length} valid lists. This feature will import your data when you sign up!`
        )
      }

      setShowImportModal(false)
      setImportFile(null)
    } catch (error) {
      console.error('Error importing data:', error)
      let errorMessage = 'Unable to import the file'
      
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = 'Invalid file format. Please select a valid JSON file.'
        } else if (error.message.includes('Invalid file format')) {
          errorMessage = error.message
        }
      }
      
      toast.error('Import failed', errorMessage)
    } finally {
      setImportProgress(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file)
      } else {
        toast.error('Invalid file type', 'Please select a JSON file')
        event.target.value = ''
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium p-8 text-center animate-scale-in">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glass animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/2 w-64 h-64 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-15 animate-morph"></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-gradient-to-r from-secondary to-primary rounded-full blur-2xl opacity-10 animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-premium p-6 mb-8 animate-slide-down hover-lift">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-primary animate-bounce-in" />
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
            </div>
          </div>
        </div>

        {/* Shopping Lists - Moved to top */}
        <div className="mb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(shoppingLists) && shoppingLists.map((list) => (
                <div
                  key={`list-${list.id}`}
                  className="glass-card p-4 hover:scale-[1.02] transition-all duration-200 relative group"
                >
                  <Link
                    href={`/list/${list.id}`}
                    className="block"
                  >
                    <div className="pr-20">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-glass-heading">{list?.name || 'Unnamed List'}</h3>
                      </div>
                      <p className="text-glass-muted text-sm mb-3">{list?.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-xs text-glass-muted mb-3">
                        <span>{list?.itemCount || 0} items</span>
                        <span>{list?.completedCount || 0} completed</span>
                        <span>{formatDate(list?.created_at)}</span>
                      </div>
                      
                      {/* Progress Bar - Moved down */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full h-2 bg-glass-white-light rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ 
                                                              width: `${getCompletionPercentage(
                                list?.completedCount || 0,
                                list?.itemCount || 0
                              )}%`  
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {getCompletionPercentage(
                            list?.completedCount || 0,
                            list?.itemCount || 0
                          )}%
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => handleExportSingleList(list, e)}
                      className="p-2 glass-button hover:bg-green-500/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm"
                      title="Export list"
                    >
                      <Download className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={(e) => handleEditList(list, e)}
                      className="p-2.5 glass-button hover:bg-primary/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm"
                      title="Edit list"
                    >
                      <Edit className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteList(list, e)}
                      className="p-2.5 glass-button hover:bg-red-500/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm border border-red-200/30"
                      title="Delete list"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
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

        {/* AI Insights Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Insights and Analytics */}
          <div className="lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {/* AI Suggestions */}
             {user && user.id && (
              <AISuggestions 
                userId={user.id}
                apiKey={profile?.gemini_api_key || ''}
                profile={profile}
                onItemAdded={() => {
                  // Refresh shopping lists when items are added
                  if (!isDemoMode) {
                    fetchShoppingLists(user.id)
                  }
                }}
              />
            )}
            {/* AI Shopping Analytics */}
            {user && user.id && (
              <AIShoppingAnalytics 
                userId={user.id}
                apiKey={profile?.gemini_api_key || ''}
                profile={profile}
                analytics={analytics || {}}
                shoppingLists={shoppingLists || []}
              />
            )}
            {/* AI-Powered Insights */}
            {user && user.id ? (
              <GenAIInsights 
                userId={user.id}
                apiKey={profile?.gemini_api_key || ''}
                profile={profile}
                analytics={analytics || {}}
                shoppingLists={shoppingLists || []}
                onRefresh={() => {
                  if (!isDemoMode) {
                    fetchAnalytics(user.id)
                  }
                }}
              />
            ) : (
              /* Basic Insights Fallback */
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-glass-heading">
                  <BarChart3 className="w-5 h-5" />
                  Quick Insights
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-glass-muted">Most shopped category</p>
                    <p className="font-semibold text-primary">{analytics?.most_frequent_category || 'Groceries'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-glass-muted mb-2">Top items</p>
                    <div className="space-y-1">
                      {analytics?.most_frequent_items?.slice(0, 3).map((item, index) => (
                        <div key={`analytics-item-${item.name}-${index}`} className="flex justify-between text-sm">
                          <span className="text-glass">{item.name}</span>
                          <span className="text-glass-muted">{item.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {!profile?.gemini_api_key && (
                    <div className="mt-4 p-3 glass rounded-lg border border-blue-200/30">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Sparkles className="w-4 h-4" />
                        <span>Enable AI insights in settings for personalized recommendations</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Smart Shopping Tips */}
            {user && user.id && (
              <SmartShoppingTips 
                userId={user.id}
                apiKey={profile?.gemini_api_key || ''}
                profile={profile}
                analytics={analytics || {}}
                shoppingLists={shoppingLists || []}
              />
            )}

            

            {/* Recent Lists */}
            {Array.isArray(shoppingLists) && shoppingLists.length > 0 && (
              <div className="glass-card p-6 mb-6">
                <h3 className="font-bold mb-4 text-glass-heading flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Lists
                </h3>
                <div className="space-y-2">
                  {shoppingLists.slice(0, 3).map((list) => (
                    <Link
                      key={`recent-${list.id}`}
                      href={`/list/${list.id}`}
                      className="flex items-center gap-3 p-3 glass-button hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-glass-heading truncate">{list?.name || 'Unnamed List'}</p>
                        <p className="text-xs text-glass-muted">
                          {list?.itemCount || 0} items • {formatDate(list?.updated_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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
                
                <button 
                  onClick={() => setShowTemplatesModal(true)}
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <BookOpen className="w-4 h-4" />
                  Use Template
                </button>
                
                <button 
                  onClick={handleSearchLists}
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <Search className="w-4 h-4" />
                  Search Lists
                </button>
                
                
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    href="/settings"
                    className="glass-button p-3 flex items-center gap-2 justify-center"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <button 
                    onClick={handleExportData}
                    className="glass-button p-3 flex items-center gap-2 justify-center"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <button 
                  onClick={() => setShowImportModal(true)}
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>

                <div className="pt-2 border-t border-glass-white-light/30">
                  <div className="text-xs text-glass-muted text-center mb-2">
                    AI suggestions are now available in the sidebar →
                  </div>
                </div>
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
                  className="w-full glass-input"
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
                Are you sure you want to delete <strong>"{listToDelete?.name || 'this list'}"</strong>?
              </p>
              <p className="text-glass-muted text-sm mt-2">
                This will permanently remove the list and all {listToDelete?.itemCount || 0} items in it.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmDeleteList}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30 px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
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

      {/* Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setShowSearchModal(false)
            setSearchQuery('')
          }}
        >
          <div 
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Your Lists
            </h3>
            
            <div className="mb-4 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full glass-input ${searchQuery ? 'pr-10' : ''}`}
                placeholder="Type to search lists..."
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-glass-muted hover:text-glass-heading transition-colors duration-200"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getFilteredLists().map((list) => (
                <Link
                  key={`search-${list.id}`}
                  href={`/list/${list.id}`}
                  className="block p-3 glass-card hover:scale-[1.02] transition-all duration-200"
                  onClick={() => {
                    setShowSearchModal(false)
                    setSearchQuery('')
                  }}
                >
                  <h4 className="font-medium text-glass-heading">{list?.name || 'Unnamed List'}</h4>
                  <p className="text-sm text-glass-muted">{list?.description || 'No description'}</p>
                  <p className="text-xs text-glass-muted mt-1">
                    {list?.itemCount || 0} items
                  </p>
                </Link>
              ))}
              {getFilteredLists().length === 0 && searchQuery && (
                <p className="text-center text-glass-muted py-4">No lists found matching "{searchQuery}"</p>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowSearchModal(false)
                  setSearchQuery('')
                }}
                className="flex-1 glass-button px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Templates Modal */}
      {showTemplatesModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => setShowTemplatesModal(false)}
        >
          <div 
            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Choose a Template
            </h3>
            
            <div className="grid gap-4">
              {listTemplates.map((template, index) => (
                <div
                  key={`template-${template.name}-${index}`}
                  className="glass-card p-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <h4 className="font-semibold text-glass-heading mb-1">{template.name}</h4>
                  <p className="text-sm text-glass-muted mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.items.slice(0, 4).map((item, itemIndex) => (
                      <span
                        key={`template-item-${template.name}-${itemIndex}`}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                    {template.items.length > 4 && (
                      <span className="text-xs text-glass-muted px-2 py-1">
                        +{template.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="flex-1 glass-button px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setShowImportModal(false)
            setImportFile(null)
          }}
        >
          <div 
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Shopping Lists
            </h3>
            
            <div className="mb-6">
              <p className="text-glass-muted text-sm mb-4">
                Import your shopping lists from a previously exported JSON file or compatible format.
              </p>
              
              <div className="border-2 border-dashed border-glass-white-light/30 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-glass-muted mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-glass-heading font-medium">Choose a file</span>
                  <span className="text-glass-muted block text-sm mt-1">
                    or drag and drop your JSON file here
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {importFile && (
                <div className="mt-4 p-3 glass-card">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-glass-heading truncate">{importFile.name}</p>
                      <p className="text-xs text-glass-muted">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleImportData}
                disabled={!importFile || importProgress}
                className="flex-1 glass-button px-4 py-2 bg-primary/20 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                {importProgress ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Lists
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                disabled={importProgress}
                className="flex-1 glass-button px-4 py-2"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 p-3 glass rounded-lg">
              <h4 className="font-medium text-glass-heading text-sm mb-2">Supported formats:</h4>
              <ul className="text-xs text-glass-muted space-y-1">
                <li>• GlassList export files (.json)</li>
                <li>• Lists with items and metadata</li>
                <li>• Files must contain a "lists" array</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 