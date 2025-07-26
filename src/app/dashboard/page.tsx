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
  Share2,
  Globe,
  Lock,
  Search,
  Settings,
  Users,
  Download,
  Upload,
  Sparkles,
  BookOpen,
  Filter,
  Zap,
  Copy,
  HelpCircle
} from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { useToast } from '@/lib/toast/context'
import { 
  getShoppingLists, 
  updateShoppingList, 
  deleteShoppingList, 
  getUserAnalytics,
  getListItems,
  createShoppingList,
  createManyItems,
  debugListItems,
  isDemoMode 
} from '@/lib/supabase/client'
import type { ShoppingList, ShoppingListWithItems } from '@/lib/supabase/types'

// Extended type for dashboard lists with item counts
type DashboardShoppingList = ShoppingListWithItems & {
  itemCount: number
  completedCount: number
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
  const [analytics, setAnalytics] = useState(mockAnalytics)
  const [shoppingLists, setShoppingLists] = useState<DashboardShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditList, setShowEditList] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [listToDelete, setListToDelete] = useState<any>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(false)
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
        console.log('Dashboard: Setting shopping lists:', data)
        setShoppingLists(data)
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
        setShoppingLists(mockShoppingLists as unknown as DashboardShoppingList[])
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

  const handleSearchLists = () => {
    setShowSearchModal(true)
  }

  const handleJoinList = async () => {
    if (!shareCode.trim()) {
      toast.error('Missing share code', 'Please enter a share code')
      return
    }

    try {
      if (isDemoMode) {
        // Simulate joining in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success('List joined!', 'You\'ve successfully joined the shared list')
        setShowJoinModal(false)
        setShareCode('')
        // In real app, would refresh the lists
      } else {
        // Real implementation would call the join function
        toast.info('Feature available', 'List joining will be available when you sign up!')
      }
    } catch (error) {
      console.error('Error joining list:', error)
      toast.error('Join failed', 'Unable to join the list. Please check the share code.')
    }
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
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Export failed', 'Unable to export your data')
    }
  }

  const getFilteredLists = () => {
    if (!searchQuery.trim()) return shoppingLists
    return shoppingLists.filter(list => 
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const handleExportSingleList = async (list: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      let items = []
      
      if (isDemoMode && isMockList(list)) {
        // For demo mode, create mock export data
        items = Array.from({ length: list.itemCount }, (_, i) => ({
          name: `Item ${i + 1}`,
          amount: 1,
          unit: 'pcs',
          category: 'Other',
          notes: '',
          is_checked: i < list.completedCount,
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
          name: list.name,
          description: list.description,
          is_shared: list.is_shared,
          created_at: list.created_at
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
      const safeName = list.name
        .replace(/[<>:"/\\|?*]/g, '_') // Remove Windows filename invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50) // Limit length
      link.download = `${safeName}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('List exported', `${list.name} has been exported successfully`)
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
      console.log('Raw file content:', fileContent)
      
      const importData = JSON.parse(fileContent)
      console.log('Parsed importData:', importData)

      let validLists: any[] = []

      // Check if it's a single list import (direct list object)
      if (importData.name && typeof importData.name === 'string') {
        // Single list format
        console.log('Detected single list format')
        validLists = [importData]
      } 
      // Check if it's a multiple lists import (lists array)
      else if (importData.lists && Array.isArray(importData.lists)) {
        console.log('Detected multiple lists format')
        validLists = importData.lists.filter((list: any) => 
          list.name && typeof list.name === 'string'
        )
      }
      // Check if it's a single list wrapped in a list object
      else if (importData.list && importData.list.name && typeof importData.list.name === 'string') {
        console.log('Detected wrapped list format')
        validLists = [importData.list]
      }
      // Check if it's an array of lists directly
      else if (Array.isArray(importData) && importData.length > 0 && importData[0].name) {
        console.log('Detected direct array format')
        validLists = importData.filter((list: any) => 
          list.name && typeof list.name === 'string'
        )
      }
      else {
        console.log('No valid format detected')
        throw new Error('Invalid file format: File must contain a shopping list or lists array')
      }

      console.log('Final validLists:', validLists)
      console.log('validLists length:', validLists.length)
      
      if (validLists.length === 0) {
        throw new Error('No valid lists found in the imported file')
      }

      // Check if we're in demo mode first
      console.log('Import: isDemoMode =', isDemoMode)
      if (isDemoMode) {
        // Simulate import in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Add imported lists to the existing ones
        const newLists = validLists.map((list: any, index: number) => ({
          ...list,
          id: `imported-${Date.now()}-${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          itemCount: list.items?.length || list.itemCount || 0,
          completedCount: list.items?.filter((item: any) => item.is_checked)?.length || list.completedCount || 0
        }))

        setShoppingLists(prevLists => [...prevLists, ...newLists])
        toast.success(
          'Import successful!', 
          `Successfully imported ${validLists.length} shopping list${validLists.length > 1 ? 's' : ''}`
        )
      } else {
        // Real implementation - actually import the data
        console.log('Import: Using real database implementation')
        const { user } = await getCurrentUser()
        if (!user) {
          toast.error('Authentication required', 'Please sign in to import lists')
          return
        }

        let importedCount = 0
        let errorCount = 0

        for (const listData of validLists) {
          try {
            console.log('Processing listData:', listData)
            console.log('listData.items:', listData.items)
            console.log('listData.items type:', typeof listData.items)
            console.log('listData.items is array:', Array.isArray(listData.items))
            console.log('listData.items length:', listData.items?.length)
            
            // Create the shopping list
            const { data: newList, error: listError } = await createShoppingList({
              name: listData.name,
              description: listData.description || null,
              is_shared: listData.is_shared || false,
              user_id: user.id
            })

            if (listError) {
              console.error('Error creating list:', listError)
              if (listError === 'Supabase not available') {
                toast.error('Database not available', 'Please check your database configuration')
                return
              }
              errorCount++
              continue
            }

            // Import items if they exist
            if (listData.items && Array.isArray(listData.items) && listData.items.length > 0) {
              console.log('Processing items for list:', listData.name, 'Items:', listData.items)
              
              const itemsToCreate = listData.items.map((item: any, index: number) => ({
                list_id: newList.id,
                name: item.name,
                amount: item.quantity || item.amount || 1,
                unit: item.unit || 'pcs',
                category: item.category || 'Other',
                notes: item.notes || null,
                is_checked: !!item.is_checked, // Force boolean conversion
                position: index
              }))

              console.log('Items to create:', itemsToCreate)

              const { data: createdItems, error: itemsError } = await createManyItems(itemsToCreate)
              console.log('createManyItems result:', { createdItems, itemsError })
              
              if (itemsError) {
                console.error('Error creating items for list:', itemsError)
                if (itemsError === 'Supabase not available') {
                  toast.error('Database not available', 'Please check your database configuration')
                  return
                }
                toast.error('Item import failed', `Failed to import items for ${listData.name}: ${itemsError}`)
                // Continue even if items fail - the list was created successfully
              } else {
                console.log('Successfully created items:', createdItems?.length || 0)
                if (createdItems && createdItems.length > 0) {
                  toast.success('Items imported', `Successfully imported ${createdItems.length} items to ${listData.name}`)
                  
                  // Debug: Check if items are actually in the database
                  setTimeout(async () => {
                    const { data: debugItems } = await debugListItems(newList.id)
                    console.log(`Debug: Found ${debugItems?.length || 0} items in database for list ${newList.id}`)
                  }, 1000)
                }
              }
            } else {
              console.log('No items to import for list:', listData.name)
            }

            importedCount++
          } catch (error) {
            console.error('Error importing list:', error)
            errorCount++
          }
        }

        // Add a small delay to ensure items are committed to database
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Refresh the shopping lists
        await fetchShoppingLists(user.id)
        
        // If we imported items but they're not showing up, try refreshing again after a longer delay
        if (importedCount > 0 && validLists.some(list => list.items && list.items.length > 0)) {
          console.log('Items were imported, checking if they appear in the refreshed lists...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          await fetchShoppingLists(user.id)
        }

        if (errorCount > 0) {
          toast.warning(
            'Import completed with errors', 
            `Successfully imported ${importedCount} list${importedCount > 1 ? 's' : ''}, ${errorCount} failed`
          )
        } else {
          toast.success(
            'Import successful!', 
            `Successfully imported ${importedCount} shopping list${importedCount > 1 ? 's' : ''}`
          )
        }
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
                        onClick={(e) => handleExportSingleList(list, e)}
                        className="p-2 glass-button hover:bg-green-500/20 hover:scale-110 rounded-lg transition-all duration-200 shadow-sm"
                        title="Export list"
                      >
                        <Download className="w-4 h-4 text-green-600" />
                      </button>
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

            {/* Recent Lists */}
            {shoppingLists.length > 0 && (
              <div className="glass-card p-6 mb-6">
                <h3 className="font-bold mb-4 text-glass-heading flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Lists
                </h3>
                <div className="space-y-2">
                  {shoppingLists.slice(0, 3).map((list) => (
                    <Link
                      key={list.id}
                      href={`/list/${list.id}`}
                      className="flex items-center gap-3 p-3 glass-button hover:scale-[1.02] transition-all duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-glass-heading truncate">{list.name}</p>
                        <p className="text-xs text-glass-muted">
                          {isDemoMode && isMockList(list) ? list.itemCount : 0} items • {formatDate(list.created_at)}
                        </p>
                      </div>
                      {list.is_shared && (
                        <Share2 className="w-4 h-4 text-primary" />
                      )}
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
                
                <button 
                  onClick={() => setShowJoinModal(true)}
                  className="glass-button w-full p-3 flex items-center gap-2 justify-center"
                >
                  <Users className="w-4 h-4" />
                  Join Shared List
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
                  Import Lists
                </button>

                <div className="pt-2 border-t border-glass-white-light/30">
                  <button 
                    onClick={() => toast.info('AI Assistant', 'Ask AI to help create smart shopping lists based on your preferences!')}
                    className="glass-button w-full p-3 flex items-center gap-2 justify-center bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200/30"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-purple-600">AI Suggestions</span>
                  </button>
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
            
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted"
                placeholder="Type to search lists..."
                autoFocus
              />
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getFilteredLists().map((list) => (
                <Link
                  key={list.id}
                  href={`/list/${list.id}`}
                  className="block p-3 glass-card hover:scale-[1.02] transition-all duration-200"
                  onClick={() => {
                    setShowSearchModal(false)
                    setSearchQuery('')
                  }}
                >
                  <h4 className="font-medium text-glass-heading">{list.name}</h4>
                  <p className="text-sm text-glass-muted">{list.description}</p>
                  <p className="text-xs text-glass-muted mt-1">
                    {isDemoMode && isMockList(list) ? list.itemCount : 0} items
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

      {/* Join List Modal */}
      {showJoinModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setShowJoinModal(false)
            setShareCode('')
          }}
        >
          <div 
            className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Join Shared List
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-glass-muted mb-2">Share Code</label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted font-mono"
                placeholder="Enter 6-character code"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-glass-muted mt-2">
                Enter the share code provided by the list owner
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleJoinList}
                disabled={!shareCode.trim()}
                className="flex-1 glass-button px-4 py-2 bg-primary/20 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                <Users className="w-4 h-4" />
                Join List
              </button>
              <button 
                onClick={() => {
                  setShowJoinModal(false)
                  setShareCode('')
                }}
                className="flex-1 glass-button px-4 py-2"
              >
                Cancel
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
                  key={index}
                  className="glass-card p-4 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <h4 className="font-semibold text-glass-heading mb-1">{template.name}</h4>
                  <p className="text-sm text-glass-muted mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.items.slice(0, 4).map((item, itemIndex) => (
                      <span
                        key={itemIndex}
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
                Import your shopping lists from a previously exported JSON file. Supports both single list and multiple lists formats.
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
                <li>• Single shopping list objects</li>
                <li>• Multiple lists in "lists" array</li>
                <li>• Single list wrapped in "list" object</li>
                <li>• Direct array of shopping lists</li>
                <li>• GlassList export files (.json)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 