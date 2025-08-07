'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  ShoppingCart, 
  Users, 
  Share2,
  Eye,
  Sparkles,
  Search,
  Filter,
  SortAsc,
  MoreVertical,
  Copy,
  Mail,
  Calendar,
  Package,
  Camera,
  Apple,
  Milk,
  Beef,
  Cookie,
  Snowflake,
  Home,
  Package2,
  Utensils,
  Save,
  SoapDispenserDroplet,
  X,
  GripVertical,
  Download,
  Upload,
  CheckCircle,
  Mic,
  MicOff,
  Play,
  Square,
  Type,
  Leaf,
  Receipt,
  PackageCheck,
  Trash,
  ThermometerSnowflake,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from 'lucide-react'

import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableFilterPill from '@/components/SortableFilterPill'

import { getCurrentUser, getProfile } from '@/lib/supabase/auth'
import { parseShoppingListWithAI, analyzeVoiceRecording } from '@/lib/ai/gemini'
import { autoPopulateItemDetails, fallbackAutoPopulate } from '@/lib/ai/auto-populate'
import { uploadItemImage, createImagePreview, revokeImagePreview } from '@/lib/supabase/storage'
import { useToast } from '@/lib/toast/context'
import { 
  getShoppingList, 
  getListItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  toggleItemChecked,
  isDemoMode,
  createManyItems,
  updateCategoryOrder
} from '@/lib/supabase/client'
import { undoManager, createDeleteItemUndoAction } from '@/lib/undo-redo/simple'

// Category icons mapping
const categoryIcons: { [key: string]: any } = {
  'Produce': Apple,
  'Dairy': Milk,
  'Meat': Beef,
  'Bakery': Cookie,
  'Pantry': Package2,
  'Hygiene': SoapDispenserDroplet,
  'Household': Home,
  'Other': Package2,
  'Snacks': Cookie,
  'Beverages': Milk,
  'Party': Sparkles,
  'Organics': Leaf,
  'Registers': Receipt,
  'Canned Goods': PackageCheck,
  'Freezer': ThermometerSnowflake
}

// Mock data for demo mode
const mockList = {
  id: '1',
  name: 'Weekly Groceries',
  description: 'Regular weekly shopping items',
  is_shared: true,
  share_code: 'DEMO1234',
  user_role: 'owner',
  created_at: '2024-01-15T10:00:00Z',
  list_members: [
    {
      id: '1',
      role: 'owner',
      joined_at: '2024-01-15T10:00:00Z',
      profiles: { full_name: 'Demo User', email: 'demo@example.com', avatar_url: null }
    },
    {
      id: '2', 
      role: 'editor',
      joined_at: '2024-01-16T10:00:00Z',
      profiles: { full_name: 'Sarah Wilson', email: 'sarah@example.com', avatar_url: null }
    }
  ]
}

const mockItems = [
  { id: '1', name: 'Milk', amount: 1, unit: 'bottle', category: 'Dairy', notes: 'Organic preferred', is_checked: false, image_url: null },
  { id: '2', name: 'Bread', amount: 2, unit: 'pcs', category: 'Bakery', notes: null, is_checked: true, image_url: null },
  { id: '3', name: 'Apples', amount: 6, unit: 'pcs', category: 'Produce', notes: 'Honeycrisp', is_checked: false, image_url: null },
  { id: '4', name: 'Bananas', amount: 1, unit: 'bunch', category: 'Produce', notes: null, is_checked: false, image_url: null },
  { id: '5', name: 'Chicken Breast', amount: 2, unit: 'lb', category: 'Meat', notes: 'Free range', is_checked: true, image_url: null },
  { id: '6', name: 'Eggs', amount: 1, unit: 'dozen', category: 'Dairy', notes: null, is_checked: false, image_url: null }
]

export default function ListPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.listId as string
  const toast = useToast()
  
  // DnD Kit sensors for better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )


  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [list, setList] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isShoppingMode, setIsShoppingMode] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAiAdd, setShowAiAdd] = useState(false)
  const [showSharing, setShowSharing] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [hideCheckedItems, setHideCheckedItems] = useState(false)
  const [orderedCategories, setOrderedCategories] = useState<string[]>([])
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [newItem, setNewItem] = useState({
    name: '',
    amount: 1,
    unit: 'pcs',
    category: 'Other',
    notes: '',
    image_url: null as string | null
  })
  const [aiInput, setAiInput] = useState('')
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiInputMode, setAiInputMode] = useState<'text' | 'voice'>('text')
  
  // Edit form state for items only
  const [editItemForm, setEditItemForm] = useState({
    name: '',
    amount: 1,
    unit: 'pcs',
    category: 'Other',
    notes: '',
    image_url: null as string | null
  })
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Import/Export state
  const [showListImport, setShowListImport] = useState(false)
  const [showListExport, setShowListExport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showVoiceResults, setShowVoiceResults] = useState(false)
  const [voiceParsedItems, setVoiceParsedItems] = useState<any[]>([])
  const [selectedVoiceItems, setSelectedVoiceItems] = useState<Set<string>>(new Set())
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [showVoiceFallback, setShowVoiceFallback] = useState(false)
  const [voiceFallbackInput, setVoiceFallbackInput] = useState('')

  // Auto-populate state
  const [isAutoPopulating, setIsAutoPopulating] = useState(false)
  const [autoPopulateTimeout, setAutoPopulateTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Filter pills state
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior for filter pills
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadData = async () => {
    console.log('ListPage: loadData called with listId:', listId)
    try {
      if (!isDemoMode) {
        console.log('ListPage: Not in demo mode, loading real data')
        
        // Load real data from Supabase
        console.log('ListPage: Getting current user...')
        const { user: currentUser } = await getCurrentUser()
        if (!currentUser) {
          console.log('ListPage: No user found, redirecting to auth')
          router.push('/auth')
          return
        }
        console.log('ListPage: User found:', currentUser.id)
        setUser(currentUser)
        
        // Load user profile (including decrypted API key)
        console.log('ListPage: Getting user profile...')
        const { profile: userProfile } = await getProfile(currentUser.id)
        console.log('ListPage: Profile loaded:', userProfile?.id)
        setProfile(userProfile)
        
        // Load list data
        console.log('ListPage: About to fetch list data for listId:', listId)
        const { data: listData, error: listError } = await getShoppingList(listId)
        console.log('ListPage: List data result:', { data: listData?.id, error: listError })
        
        if (listError || !listData) {
          console.error('ListPage: List error or no data:', listError)
          toast.error('List not found', 'The requested list could not be found')
          router.push('/dashboard')
          return
        }
        console.log('ListPage: Setting list data')
        setList(listData)
        
        // Load items
        console.log('ListPage: About to fetch items for listId:', listId)
        const { data: itemsData, error: itemsError } = await getListItems(listId)
        console.log('ListPage: Items data result:', { count: itemsData?.length, error: itemsError })
        
        if (!itemsError && itemsData) {
          console.log('ListPage: Setting items data')
          setItems(itemsData)
          
          // Load category order from the list, or create default order from items
          const savedCategoryOrder = listData.category_order as string[] | null
          const availableCategories = Array.from(new Set(itemsData.map(item => item.category || 'Other')))
          
          if (savedCategoryOrder && savedCategoryOrder.length > 0) {
            // Use saved order, but add any new categories that aren't in the saved order
            const newCategories = availableCategories.filter(cat => !savedCategoryOrder.includes(cat))
            const finalOrder = [...savedCategoryOrder, ...newCategories]
            setOrderedCategories(finalOrder)
          } else {
            // No saved order, use default order from items
            setOrderedCategories(availableCategories)
          }
        } else if (itemsError) {
          console.error('ListPage: Items error:', itemsError)
        }
      } else {
        console.log('ListPage: In demo mode, using mock data')
        // Use demo data
        setList(mockList)
        setItems(mockItems)
        const initialCategories = Array.from(new Set(mockItems.map(item => item.category || 'Other')))
        setOrderedCategories(initialCategories)
      }
    } catch (error) {
      console.error('ListPage: Error loading list:', error)
      toast.error('Loading failed', 'Failed to load list data')
    } finally {
      console.log('ListPage: Setting loading to false')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [listId])

  const handleToggleItem = async (itemId: string) => {
    const item = items.find(item => item.id === itemId)
    if (!item) return

    const newCheckedState = !item.is_checked

    // Optimistic update
    setItems(items.map(item => 
      item.id === itemId ? { ...item, is_checked: newCheckedState } : item
    ))

    if (!isDemoMode) {
      const { error } = await toggleItemChecked(itemId, newCheckedState)
      if (error) {
        // Revert on error
        setItems(items.map(item => 
          item.id === itemId ? { ...item, is_checked: !newCheckedState } : item
        ))
        toast.error('Update failed', 'Failed to update item status')
      } else {
        // Show success toast for item checked/unchecked
        const action = newCheckedState ? 'checked' : 'unchecked'
        const customIcon = newCheckedState ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Square className="w-5 h-5 text-gray-600" />
        )
        toast.success(
          `Item ${action}`, 
          `${item.name} has been ${action}`,
          { customIcon }
        )
      }
    } else {
      // Show success toast even in demo mode
      const action = newCheckedState ? 'checked' : 'unchecked'
      const customIcon = newCheckedState ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <Square className="w-5 h-5 text-gray-600" />
      )
      toast.success(
        `Item ${action}`, 
        `${item.name} has been ${action}`,
        { customIcon }
      )
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const previewUrl = createImagePreview(file)
      setImagePreview(previewUrl)
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      revokeImagePreview(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
    setNewItem({ ...newItem, image_url: null })
  }

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return

    setIsUploading(true)
    try {
      let imageUrl = null

      // Upload image if selected
      if (selectedImage && !isDemoMode) {
        const itemId = Date.now().toString()
        const uploadResult = await uploadItemImage(selectedImage, itemId)
        if (uploadResult.success) {
          imageUrl = uploadResult.url
          toast.success('Image uploaded', 'Photo added to your item')
        } else {
          toast.error('Upload failed', uploadResult.error || 'Failed to upload image')
          setIsUploading(false)
          return
        }
      } else if (selectedImage && isDemoMode) {
        // In demo mode, use the preview URL
        imageUrl = imagePreview
      }

      const itemData = {
        list_id: listId,
        name: newItem.name,
        amount: newItem.amount,
        unit: newItem.unit as any,
        category: newItem.category,
        notes: newItem.notes || null,
        image_url: imageUrl,
        is_checked: false
      }

      console.log('About to create item:', itemData)

      if (!isDemoMode) {
        const { data: createdItem, error } = await createItem(itemData)
        console.log('Create item response:', { data: createdItem?.id, error })
        
        if (error) {
          console.error('Failed to create item:', error)
          const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Failed to add item'
          toast.error('Failed to add item', errorMessage)
          setIsUploading(false)
          return
        }
        
        if (!createdItem) {
          toast.error('Failed to add item', 'No data returned from server')
          setIsUploading(false)
          return
        }
        
        setItems([...items, createdItem])
      } else {
        // Demo mode
        const item = {
          id: Date.now().toString(),
          ...itemData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: 0
        }
        setItems([...items, item])
      }
      
      // Show success toast
      toast.success('Item added', `${newItem.name} added to your list`)
      
      // Reset form
      setNewItem({ name: '', amount: 1, unit: 'pcs', category: 'Other', notes: '', image_url: null })
      handleRemoveImage()
      setShowAddItem(false)
    } catch (error) {
      console.error('Error adding item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again'
      toast.error('Failed to add item', errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const item = items.find(item => item.id === itemId)
    if (!item) return

    // Create undo action
    const undoActionData = createDeleteItemUndoAction(listId, item, itemId, () => {
      // Refresh items after undo
      loadData()
    })
    const undoAction = undoManager.addAction(undoActionData)

    // Optimistic update
    setItems(items.filter(item => item.id !== itemId))

    if (!isDemoMode) {
      const { error } = await deleteItem(itemId)
      if (error) {
        // Revert on error
        setItems([...items, item])
        toast.error('Delete failed', 'Failed to delete item')
        return
      }
    }

    // Show toast with undo button
    toast.success(
      'Item removed', 
      `${item.name} removed from your list`,
      {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              const latestAction = undoManager.getLatestAction()
              if (latestAction && latestAction.id === undoAction.id) {
                await latestAction.execute()
                undoManager.removeAction(latestAction.id)
                toast.success('Undone', `${item.name} has been restored`)
              }
            } catch (error) {
              console.error('Error undoing action:', error)
              toast.error('Undo failed', 'Failed to restore the item')
            }
          }
        }
      }
    )
  }

  const handleAiAdd = async () => {
    if (!aiInput.trim()) return

    setIsAiProcessing(true)
    try {
      // In demo mode, simulate AI parsing
      if (isDemoMode) {
        // Simple demo parsing
        const words = aiInput.toLowerCase().split(' ')
        const demoItems = words.map((word, index) => ({
          id: (Date.now() + index).toString(),
          list_id: listId,
          name: word.charAt(0).toUpperCase() + word.slice(1),
          amount: 1,
          unit: 'pcs',
          category: 'Other',
          notes: '',
          is_checked: false,
          image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: 0
        }))
        setItems([...items, ...demoItems])
        toast.success('AI items added', `Added ${demoItems.length} items from your input`)
      } else {
        // Real AI parsing - use the user's actual profile
        if (profile?.gemini_api_key) {
          const result = await parseShoppingListWithAI(aiInput, profile.gemini_api_key)
          if (result.success && result.items) {
            const itemsToCreate = result.items.map(item => ({
              list_id: listId,
              name: item.name,
              amount: item.amount,
              unit: item.unit as any,
              category: item.category,
              notes: item.notes || null,
              is_checked: false
            }))

            const { data: createdItems, error } = await createManyItems(itemsToCreate)
            if (error || !createdItems) {
              toast.error('AI parsing failed', 'Failed to add items to your list')
              return
            }

            setItems([...items, ...createdItems])
            toast.success('AI parsing complete', `Added ${createdItems.length} items to your list`)
          } else {
            toast.error('AI parsing failed', result.error || 'Unable to parse your input. Try being more specific.')
          }
        } else {
          toast.warning('API key required', 'Please add your Gemini API key in Settings to use AI features')
        }
      }
      
      setAiInput('')
      setShowAiAdd(false)
    } catch (error) {
      console.error('AI parsing error:', error)
      toast.error('AI parsing error', 'Something went wrong. Please try again.')
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setEditItemForm({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      category: item.category,
      notes: item.notes || '',
      image_url: item.image_url || null
    })
    setShowEditItem(true)
  }

  const handleSaveItem = async () => {
    if (!editItemForm.name.trim() || !editingItem) return

    setIsUploading(true)
    try {
      let imageUrl = editItemForm.image_url

      // Upload new image if selected
      if (selectedImage && !isDemoMode) {
        const uploadResult = await uploadItemImage(selectedImage, editingItem.id)
        if (uploadResult.success) {
          imageUrl = uploadResult.url || null
          toast.success('Image updated', 'Photo updated successfully')
        } else {
          toast.error('Upload failed', uploadResult.error || 'Failed to upload image')
          setIsUploading(false)
          return
        }
      } else if (selectedImage && isDemoMode) {
        // In demo mode, use the preview URL
        imageUrl = imagePreview
      }

      const updatedItemData = {
        name: editItemForm.name,
        amount: editItemForm.amount,
        unit: editItemForm.unit as any,
        category: editItemForm.category,
        notes: editItemForm.notes || null,
        image_url: imageUrl
      }



      if (!isDemoMode) {
        const { data: updatedItem, error } = await updateItem(editingItem.id, updatedItemData)
        if (error || !updatedItem) {
          toast.error('Update failed', 'Failed to update item')
          setIsUploading(false)
          return
        }
        setItems(items.map(item => 
          item.id === editingItem.id ? updatedItem : item
        ))
      } else {
        // Demo mode
        setItems(items.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...updatedItemData }
            : item
        ))
      }
      
      // Show success toast
      toast.success('Item updated', `${editItemForm.name} has been updated`)
      
      // Reset state
      setShowEditItem(false)
      setEditingItem(null)
      if (imagePreview) {
        revokeImagePreview(imagePreview)
      }
      setSelectedImage(null)
      setImagePreview(null)
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Update failed', 'Failed to update item')
    } finally {
      setIsUploading(false)
    }
  }

  const handleShareList = async () => {
    if (!list?.share_code) return
    
    try {
      const shareUrl = `${window.location.origin}/join/${list.share_code}`
      await navigator.clipboard.writeText(shareUrl)
      
      toast.success('Link copied!', 'Share link copied to clipboard')
    } catch (error) {
      toast.error('Copy failed', 'Unable to copy link to clipboard')
    }
  }

  const handleExportList = async () => {
    try {
      // Validate required data before proceeding
      if (!list || !list.name) {
        toast.error('Export failed', 'List information is missing')
        return
      }

      if (!Array.isArray(items)) {
        toast.error('Export failed', 'Items data is invalid')
        return
      }

      const exportData = {
        list: {
          name: list.name || 'Untitled List',
          description: list.description || '',
          is_shared: Boolean(list.is_shared),
          created_at: list.created_at || new Date().toISOString()
        },
        items: items.map(item => ({
          name: item?.name || 'Unnamed Item',
          amount: Number(item?.amount) || 1,
          unit: item?.unit || 'pcs',
          category: item?.category || 'Other',
          notes: item?.notes || '',
          is_checked: Boolean(item?.is_checked),
          image_url: item?.image_url || null
        })),
        exportDate: new Date().toISOString(),
        exportType: 'single-list'
      }
      
      console.log('Export data prepared:', exportData)
      
      const dataStr = JSON.stringify(exportData, null, 2)
      
      // Create a safe filename
      const safeName = (list.name || 'list')
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase()
        .substring(0, 50) // Limit length
      
      const fileName = `${safeName}-${new Date().toISOString().split('T')[0]}.json`
      
      // Mobile-specific detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       'ontouchstart' in window ||
                       navigator.maxTouchPoints > 0
      
      if (isMobile) {
        // Mobile-friendly approach: Show the data in a new tab for manual download
        try {
          const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
          const newWindow = window.open('', '_blank')
          
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Export: ${list.name}</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                      padding: 20px; 
                      background: #f5f5f5;
                    }
                    .container {
                      background: white;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .download-btn {
                      background: #007AFF;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      font-size: 16px;
                      margin: 10px 0;
                      cursor: pointer;
                      width: 100%;
                    }
                    .share-btn {
                      background: #34C759;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      font-size: 16px;
                      margin: 10px 0;
                      cursor: pointer;
                      width: 100%;
                    }
                    pre {
                      background: #f8f8f8;
                      padding: 15px;
                      border-radius: 4px;
                      overflow-x: auto;
                      font-size: 12px;
                      max-height: 300px;
                      overflow-y: auto;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>Export: ${list.name}</h2>
                    <p>Your shopping list has been prepared for export.</p>
                    
                    <button class="download-btn" onclick="downloadFile()">
                      📱 Download File (${fileName})
                    </button>
                    
                                         ${typeof navigator.share === 'function' ? `
                       <button class="share-btn" onclick="shareFile()">
                         📤 Share via Apps
                       </button>
                     ` : ''}
                    
                    <details>
                      <summary>View Export Data</summary>
                      <pre>${dataStr}</pre>
                    </details>
                    
                    <p style="color: #666; font-size: 14px;">
                      💡 Tip: Use the download button above or copy the data to save your list.
                    </p>
                  </div>
                  
                  <script>
                    function downloadFile() {
                      try {
                        const blob = new Blob([${JSON.stringify(dataStr)}], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = '${fileName}';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        alert('Download started! Check your downloads folder.');
                      } catch (error) {
                        console.error('Download error:', error);
                        alert('Download failed. Please try copying the data instead.');
                      }
                    }
                    
                    ${typeof navigator.share === 'function' ? `
                      async function shareFile() {
                        try {
                          const blob = new Blob([${JSON.stringify(dataStr)}], { type: 'application/json' });
                          const file = new File([blob], '${fileName}', { type: 'application/json' });
                          
                          if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                              title: 'Shopping List Export: ${list.name}',
                              text: 'Exported shopping list from GlassList',
                              files: [file]
                            });
                          } else {
                            await navigator.share({
                              title: 'Shopping List Export: ${list.name}',
                              text: 'Exported shopping list data: ' + ${JSON.stringify(dataStr)}
                            });
                          }
                        } catch (error) {
                          console.error('Share error:', error);
                          alert('Sharing failed. Please try the download button instead.');
                        }
                      }
                    ` : ''}
                  </script>
                </body>
              </html>
            `)
            newWindow.document.close()
          } else {
            throw new Error('Popup blocked')
          }
        } catch (error) {
          console.error('Mobile export error:', error)
          // Fallback: copy to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(dataStr)
            toast.success('Copied to clipboard', 'Export data copied. You can paste it into a text file.')
          } else {
            toast.error('Export failed', 'Unable to export on this mobile browser. Please try on desktop.')
          }
        }
      } else {
        // Desktop approach: Direct download
        const dataBlob = new Blob([dataStr], { type: 'application/json; charset=utf-8' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        
        // Append to body, click, then remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
      }
      
      if (!isMobile) {
        toast.success('List exported', `${list.name} has been exported successfully`)
      } else {
        toast.success('Export ready', 'Export opened in new tab for mobile download')
      }
      setShowListExport(false)
      
    } catch (error) {
      console.error('Error exporting list:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error('Export failed', `Unable to export the list: ${errorMessage}`)
      
      // Don't close the modal on error so user can try again
    }
  }

  const handleImportToList = async () => {
    if (!importFile) {
      toast.error('No file selected', 'Please select a file to import')
      return
    }

    setImportProgress(true)

    try {
      const fileContent = await importFile.text()
      const importData = JSON.parse(fileContent)

      // Validate the imported data structure
      let itemsToImport = []
      
      if (importData.items && Array.isArray(importData.items)) {
        // Single list format
        itemsToImport = importData.items
      } else if (importData.lists && Array.isArray(importData.lists) && importData.lists.length > 0) {
        // Multiple lists format - take the first list's items
        itemsToImport = importData.lists[0].items || []
      } else {
        throw new Error('Invalid file format: No items found')
      }

      const validItems = itemsToImport.filter((item: any) => 
        item.name && typeof item.name === 'string'
      )

      if (validItems.length === 0) {
        throw new Error('No valid items found in the imported file')
      }

      if (isDemoMode) {
        // Simulate import in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Add imported items to the current list
        const newItems = validItems.map((item: any, index: number) => ({
          id: `imported-${Date.now()}-${index}`,
          list_id: listId,
          name: item.name,
          amount: item.amount || 1,
          unit: item.unit || 'pcs',
          category: item.category || 'Other',
          notes: item.notes || '',
          is_checked: item.is_checked || false,
          image_url: item.image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          position: 0
        }))

        setItems(prevItems => [...prevItems, ...newItems])
        toast.success(
          'Import successful!', 
          `Successfully imported ${validItems.length} item${validItems.length > 1 ? 's' : ''} to ${list.name}`
        )
      } else {
        // Real implementation would handle actual data import
        const itemsToCreate = validItems.map((item: any) => ({
          list_id: listId,
          name: item.name,
          amount: item.amount || 1,
          unit: item.unit || 'pcs',
          category: item.category || 'Other',
          notes: item.notes || null,
          is_checked: item.is_checked || false,
          image_url: item.image_url || null
        }))

        const { data: createdItems, error } = await createManyItems(itemsToCreate)
        if (error || !createdItems) {
          toast.error('Import failed', 'Failed to import items to your list')
          return
        }

        setItems(prevItems => [...prevItems, ...createdItems])
        toast.success(
          'Import successful!', 
          `Successfully imported ${createdItems.length} item${createdItems.length > 1 ? 's' : ''} to ${list.name}`
        )
      }

      setShowListImport(false)
      setImportFile(null)
    } catch (error) {
      console.error('Error importing items:', error)
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

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      return
    }
    
    const oldIndex = orderedCategories.indexOf(active.id as string)
    const newIndex = orderedCategories.indexOf(over.id as string)

    const newOrderedCategories = arrayMove(orderedCategories, oldIndex, newIndex)

    setOrderedCategories(newOrderedCategories);

    // Persist the new category order to the database
    if (!isDemoMode) {
      try {
        await updateCategoryOrder(listId, newOrderedCategories);
      } catch (error) {
        console.error('Failed to save category order:', error);
        // Optionally show a toast error, but don't revert the UI change
        // as the user has already seen the reorder happen
      }
    }
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const toggleAllCategories = () => {
    const allCollapsed = orderedCategories.every(cat => collapsedCategories.has(cat))
    if (allCollapsed) {
      setCollapsedCategories(new Set())
    } else {
      setCollapsedCategories(new Set(orderedCategories))
    }
  }

  const areAllCategoriesCollapsed = orderedCategories.every(cat => collapsedCategories.has(cat))

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      // Try different MIME types in order of preference
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported audio format found');
      }
      
      console.log('Using audio format:', selectedMimeType);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioChunks(chunks);
        
        console.log('Recording stopped', {
          blobSize: blob.size,
          blobType: blob.type,
          chunksCount: chunks.length
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording error', 'Failed to record audio. Please try again.');
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      
      toast.success('Recording started', 'Speak your shopping list items');
    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'Unable to access microphone. Please check permissions.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio recording not supported in this browser.';
        }
      }
      
      toast.error('Recording failed', errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async () => {
    if (!audioBlob || !profile?.gemini_api_key) {
      toast.error('Processing failed', 'Audio recording or API key not available');
      return;
    }

    setIsProcessingVoice(true);
    try {
      console.log('Processing voice recording...', { 
        audioBlobSize: audioBlob.size, 
        audioBlobType: audioBlob.type,
        hasApiKey: !!profile?.gemini_api_key 
      });

      // In demo mode, simulate voice analysis
      if (isDemoMode) {
        console.log('Demo mode: simulating voice analysis');
        const demoItems = [
          { name: 'Milk', amount: 1, unit: 'gallon', category: 'Dairy', notes: 'From voice recording' },
          { name: 'Bread', amount: 2, unit: 'loaves', category: 'Bakery', notes: 'Whole wheat' },
          { name: 'Apples', amount: 6, unit: 'pcs', category: 'Produce', notes: 'Honeycrisp' },
          { name: 'Chicken Breast', amount: 2, unit: 'lb', category: 'Meat', notes: 'Free range' }
        ];
        
        setVoiceParsedItems(demoItems);
        setSelectedVoiceItems(new Set(demoItems.map((_, index) => index.toString())));
        setShowVoiceResults(true);
        setShowAiAdd(false);
        toast.success('Voice analysis complete', 'Demo mode: simulated items from voice recording');
        return;
      }

      // Convert audio to base64 with proper encoding
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode(...uint8Array));
      
      console.log('Audio converted to base64', { 
        base64Length: base64Audio.length,
        audioFormat: audioBlob.type 
      });
      
      // Send to Gemini for analysis
      const result = await analyzeVoiceRecording(base64Audio, profile.gemini_api_key);
      
      console.log('Gemini analysis result:', result);
      
      if (result.success && result.items && result.items.length > 0) {
        setVoiceParsedItems(result.items);
        setSelectedVoiceItems(new Set(result.items.map((item: any, index: number) => index.toString())));
        setShowVoiceResults(true);
        setShowAiAdd(false);
        toast.success('Voice analysis complete', `Found ${result.items.length} items in your recording`);
      } else {
        console.error('Voice analysis failed:', result.error);
        toast.error('Voice analysis failed', result.error || 'Unable to process your voice recording. Please try speaking more clearly.');
        
        // Show fallback option for manual input
        setShowVoiceFallback(true);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Something went wrong. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'Invalid API key. Please check your Gemini API key in Settings.';
        } else if (error.message.includes('audio')) {
          errorMessage = 'Audio processing failed. Please try recording again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }
      
      toast.error('Voice processing error', errorMessage);
      
      // Show fallback option for manual input
      setShowVoiceFallback(true);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleVoiceItemToggle = (index: string) => {
    const newSelected = new Set(selectedVoiceItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedVoiceItems(newSelected);
  };

  const handleAddVoiceItems = async () => {
    const itemsToAdd = voiceParsedItems.filter((_, index) => 
      selectedVoiceItems.has(index.toString())
    );

    if (itemsToAdd.length === 0) {
      toast.warning('No items selected', 'Please select at least one item to add');
      return;
    }

    try {
      const itemsToCreate = itemsToAdd.map(item => ({
        list_id: listId,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        notes: item.notes || null,
        is_checked: false
      }));

      const { data: createdItems, error } = await createManyItems(itemsToCreate);
      if (error || !createdItems) {
        toast.error('Failed to add items', 'Unable to add items to your list');
        return;
      }

      setItems([...items, ...createdItems]);
      toast.success('Items added', `Added ${createdItems.length} items to your list`);
      
      // Reset voice recording state
      setShowVoiceResults(false);
      setVoiceParsedItems([]);
      setSelectedVoiceItems(new Set());
      setAudioBlob(null);
      setAudioUrl(null);
      setAiInputMode('text');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('Error adding voice items:', error);
      toast.error('Failed to add items', 'Something went wrong. Please try again.');
    }
  };

  const resetVoiceRecording = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioChunks([]);
    setAiInputMode('text');
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const handleVoiceFallback = async () => {
    if (!voiceFallbackInput.trim()) {
      toast.warning('No input', 'Please enter your shopping list items');
      return;
    }

    setIsProcessingVoice(true);
    try {
      // Use the existing AI parsing function for text input
      const result = await parseShoppingListWithAI(voiceFallbackInput, profile?.gemini_api_key || '');
      
      if (result.success && result.items && result.items.length > 0) {
        setVoiceParsedItems(result.items);
        setSelectedVoiceItems(new Set(result.items.map((item: any, index: number) => index.toString())));
        setShowVoiceResults(true);
        setShowVoiceFallback(false);
        setShowAiAdd(false);
        toast.success('Items parsed', `Found ${result.items.length} items in your input`);
      } else {
        toast.error('Parsing failed', result.error || 'Unable to parse your input. Please try being more specific.');
      }
    } catch (error) {
      console.error('Fallback parsing error:', error);
      toast.error('Parsing error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleAutoPopulate = async (itemName: string) => {
    if (!profile?.ai_auto_populate_enabled || !profile?.gemini_api_key || !itemName.trim()) {
      return
    }

    // Clear existing timeout
    if (autoPopulateTimeout) {
      clearTimeout(autoPopulateTimeout)
    }

    // Set a new timeout to avoid too many API calls
    const timeout = setTimeout(async () => {
      if (itemName.trim().length < 3) return // Don't auto-populate for very short names

      setIsAutoPopulating(true)
      try {
        const result = await autoPopulateItemDetails(itemName, profile.gemini_api_key)
        
        if (result.success) {
          setNewItem(prev => ({
            ...prev,
            amount: result.amount,
            unit: result.unit,
            category: result.category,
            notes: result.notes || prev.notes
          }))
        } else {
          // Try fallback
          const fallbackResult = fallbackAutoPopulate(itemName)
          setNewItem(prev => ({
            ...prev,
            amount: fallbackResult.amount,
            unit: fallbackResult.unit,
            category: fallbackResult.category,
            notes: fallbackResult.notes || prev.notes
          }))
        }
      } catch (error) {
        console.error('Auto-populate error:', error)
        // Silently fail - don't show error toast for auto-populate
      } finally {
        setIsAutoPopulating(false)
      }
    }, 1000) // 1 second delay

    setAutoPopulateTimeout(timeout)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesCheckedFilter = !hideCheckedItems || !item.is_checked
    return matchesSearch && matchesCategory && matchesCheckedFilter
  })

  // Group items by category and sort them
  const groupedItems = filteredItems.reduce((groups: { [key: string]: any[] }, item) => {
    const category = item.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {})

  // Sort items within each category: unchecked first, then alphabetically
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => {
      // First sort by checked status (unchecked items first)
      if (a.is_checked !== b.is_checked) {
        return a.is_checked ? 1 : -1
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name)
    })
  })

  const completedCount = items.filter(item => item.is_checked).length
  const completionPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0
  
  useEffect(() => {
    const newCategories = Array.from(new Set(items.map(item => item.category || 'Other')));
    setOrderedCategories(currentOrderedCategories => {
      const addedCategories = newCategories.filter(c => !currentOrderedCategories.includes(c));
      const removedCategories = currentOrderedCategories.filter(c => !newCategories.includes(c));
      if (addedCategories.length > 0 || removedCategories.length > 0) {
        const finalCategories = [...currentOrderedCategories.filter(c => !removedCategories.includes(c)), ...addedCategories];
        
        // Persist the updated category order when categories are added/removed
        if (!isDemoMode && finalCategories.length > 0) {
          updateCategoryOrder(listId, finalCategories).catch(error => {
            console.error('Failed to save category order after category change:', error);
          });
        }
        
        return finalCategories;
      }
      return currentOrderedCategories;
    });
  }, [items, listId, isDemoMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPopulateTimeout) {
        clearTimeout(autoPopulateTimeout)
      }
    }
  }, [autoPopulateTimeout])


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium p-8 text-center animate-scale-in">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-glass animate-pulse">Loading your list...</p>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-premium p-8 text-center animate-scale-in hover-lift">
          <h2 className="text-xl font-bold text-glass-heading mb-4 animate-slide-down">List Not Found</h2>
          <p className="text-glass-muted mb-6 animate-slide-up">The list you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard" className="glass-premium px-6 py-3 hover-glow micro-interaction animate-bounce-in inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 glass-white rounded-full blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 glass-white rounded-full blur-3xl opacity-15 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20 animate-pulse-glow"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-premium p-6 mb-6 animate-slide-down hover-lift">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="glass-premium p-2 hover-glow micro-interaction">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-glass-heading animate-scale-in" style={{ textShadow: 'none' }}>{list.name}</h1>
              {list.description && (
                <p className="text-glass-muted animate-slide-up stagger-1">{list.description}</p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              
              {!isShoppingMode && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowListImport(true)}
                    className="glass-button p-3"
                    title="Import items to this list"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={() => setShowListExport(true)}
                    className="glass-button p-3"
                    title="Export this list"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
              
              {list.is_shared && (
                <button 
                  onClick={() => setShowSharing(!showSharing)}
                  className="glass-button p-3"
                  title="Manage sharing"
                >
                  <Users className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setIsShoppingMode(!isShoppingMode)}
                className={`glass-button px-4 py-3 flex items-center gap-2 transition-all duration-200 ${
                  isShoppingMode 
                    ? 'bg-primary/30 border-2 border-primary/50 text-primary shadow-lg' 
                    : 'hover:bg-primary/10'
                }`}
                title={isShoppingMode ? "Exit shopping mode" : "Enter shopping mode"}
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {isShoppingMode ? 'Shopping' : 'Shop'}
                </span>
              </button>
              
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-glass-muted mb-1">
                <span>{completedCount} of {items.length} items</span>
                <span>{completionPercentage}% complete</span>
              </div>
              <div className="w-full h-2 bg-glass-white-light rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Shopping Mode Indicator */}
        {isShoppingMode && (
          <div className="glass-card p-4 mb-6 border-2 border-primary/30 bg-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary">Shopping Mode Active</h3>
                <p className="text-sm text-glass-muted">
                  Large, touch-friendly interface for easier shopping
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setHideCheckedItems(!hideCheckedItems)}
                  className={`text-sm glass-button px-3 py-1.5 transition-all duration-200 ${
                    hideCheckedItems 
                      ? 'bg-primary/30 border-2 border-primary/50 text-primary shadow-lg' 
                      : 'hover:bg-primary/20'
                  }`}
                  title={hideCheckedItems ? "Show checked items" : "Hide checked items"}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsShoppingMode(false)}
                  className="text-sm glass-button px-3 py-1.5 hover:bg-primary/20"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {!isShoppingMode && (
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-col gap-3">
              <div className="search-container flex items-center gap-2 sm:gap-3">
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-glass-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`glass-input w-full py-2 px-3 ${searchQuery ? 'pl-10 pr-10 has-both-icons' : 'pl-10 has-left-icon'}`}
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
                
                {/* Compact Hide Checked Toggle */}
                <button 
                  onClick={() => setHideCheckedItems(!hideCheckedItems)}
                  className={`search-toggle-button glass-button p-2.5 transition-all duration-200 flex-shrink-0 ${
                    hideCheckedItems 
                      ? 'bg-primary/30 border-2 border-primary/50 text-primary shadow-lg' 
                      : 'hover:bg-primary/20'
                  }`}
                  title={hideCheckedItems ? "Show checked items" : "Hide checked items"}
                  aria-label={hideCheckedItems ? "Show checked items" : "Hide checked items"}
                >
                  <CheckCircle className={`w-4 h-4 transition-transform ${hideCheckedItems ? 'scale-110' : ''}`} />
                </button>
              </div>
              
              {/* Category Pills */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
                modifiers={[]}
              >
                <div className="space-y-2">
                  {/* All Aisles button - positioned outside SortableContext for stability */}
                  <div className="flex-shrink-0 h-8 flex items-center">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        categoryFilter === 'all' 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'glass-button'
                      }`}
                    >
                      All Aisles
                    </button>
                  </div>
                  
                  {/* Main filter pills row */}
                  <SortableContext
                    items={orderedCategories}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-1 pb-2 overflow-x-auto scrollbar-hide min-h-[32px]"
                      style={{ 
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain'
                      }}
                    >
                      {(showAllCategories ? orderedCategories : orderedCategories.slice(0, isMobile ? 6 : 8)).map((category) => {
                        const categoryCount = items.filter(item => item.category === category).length
                        const CategoryIcon = categoryIcons[category] || Package2
                        return (
                          <SortableFilterPill
                            key={category}
                            category={category}
                            categoryCount={categoryCount}
                            CategoryIcon={CategoryIcon}
                            isActive={categoryFilter === category}
                            onClick={() => setCategoryFilter(category)}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                  
                  {/* Show more/less toggle */}
                  {orderedCategories.length > (isMobile ? 6 : 8) && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="glass-button px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-primary/10 transition-colors"
                      >
                        {showAllCategories ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Show More ({orderedCategories.length - (isMobile ? 6 : 8)} more)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </DndContext>
            </div>
          </div>
        )}

        {/* Add Item Actions */}
        {!isShoppingMode && (
          <div className="action-buttons-container flex flex-wrap gap-3 mb-6 animate-slide-up">
            <button 
              onClick={() => setShowAddItem(true)}
              className="action-button glass-premium px-4 py-3 flex items-center gap-2 hover-glow micro-interaction animate-scale-in"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Add Item
            </button>
            
            <button 
              onClick={() => setShowAiAdd(true)}
              className="action-button glass-premium px-4 py-3 flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 hover-lift micro-interaction animate-scale-in stagger-1"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              AI Quick Add
            </button>

            <button 
              onClick={toggleAllCategories}
              className={`action-button glass-premium px-3 py-3 flex items-center gap-1 sm:gap-2 micro-interaction animate-scale-in stagger-2 transition-all duration-200 ${
                areAllCategoriesCollapsed
                  ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'
                  : 'hover:bg-primary/10'
              }`}
              title={areAllCategoriesCollapsed ? "Expand all categories" : "Collapse all categories"}
              aria-label={areAllCategoriesCollapsed ? "Expand all categories" : "Collapse all categories"}
            >
              {areAllCategoriesCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                  <span className="text-sm">Expand</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Package className="w-12 h-12 text-glass-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-glass-heading mb-2">
              {isShoppingMode ? "Ready to shop!" : "No items yet"}
            </h3>
            <p className="text-glass-muted mb-4">
              {isShoppingMode 
                ? "Exit shopping mode to add items to your list." 
                : "Start building your shopping list!"
              }
            </p>
            {!isShoppingMode && (
              <button 
                onClick={() => setShowAddItem(true)}
                className="glass-button px-6 py-3"
              >
                Add Your First Item
              </button>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Search className="w-12 h-12 text-glass-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-glass-heading mb-2">
              No items found
            </h3>
            <p className="text-glass-muted mb-4">
              {searchQuery 
                ? `No items match "${searchQuery}"`
                : categoryFilter !== 'all'
                ? `No items in the "${categoryFilter}" category`
                : hideCheckedItems
                ? "No unchecked items found"
                : "No items match your current filters"
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setHideCheckedItems(false)
                }}
                className="glass-button px-6 py-3"
              >
                Clear Filters
              </button>
              {!isShoppingMode && (
                <button 
                  onClick={() => setShowAddItem(true)}
                  className="glass-button px-6 py-3"
                >
                  Add New Item
                </button>
              )}
            </div>
          </div>
        ) : (
            orderedCategories.map((category) => {
              const categoryItems = groupedItems[category]
              if (!categoryItems) return null
              const CategoryIcon = categoryIcons[category] || Package2
              const completedInCategory = categoryItems.filter((item: any) => item.is_checked).length
              const totalInCategory = categoryItems.length
              
              return (
                <div key={category} className="glass-card overflow-hidden mb-6">
                  {/* Category Header */}
                  <div className={`border-b border-glass-white-border ${isShoppingMode ? 'p-6' : 'p-4'}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategoryCollapse(category)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleCategoryCollapse(category)
                          }
                        }}
                        className={`category-header-button flex items-center gap-3 flex-1 rounded-lg p-1 ${
                          collapsedCategories.has(category) ? 'bg-glass-white-light/30' : ''
                        }`}
                        aria-expanded={!collapsedCategories.has(category)}
                        aria-label={`${collapsedCategories.has(category) ? 'Expand' : 'Collapse'} ${category} category`}
                        tabIndex={0}
                      >
                        <div className={`bg-primary/20 rounded-lg flex items-center justify-center ${isShoppingMode ? 'w-12 h-12' : 'w-8 h-8'}`}>
                          <CategoryIcon className={`text-primary ${isShoppingMode ? 'w-6 h-6' : 'w-4 h-4'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className={`font-semibold text-glass-heading ${isShoppingMode ? 'text-xl' : ''}`}>
                            {category}
                            {collapsedCategories.has(category) && (
                              <span className="ml-2 text-sm font-normal text-glass-muted">
                                ({totalInCategory} items)
                              </span>
                            )}
                          </h3>
                          {!collapsedCategories.has(category) && (
                            <p className={`text-glass-muted ${isShoppingMode ? 'text-sm' : 'text-xs'}`}>
                              {completedInCategory} of {totalInCategory} items
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-glass px-3 py-1 bg-glass-white-light rounded-full ${isShoppingMode ? 'text-base' : 'text-sm'}`}>
                            {totalInCategory}
                          </span>
                        </div>
                        <div className={`category-chevron ${collapsedCategories.has(category) ? 'rotated' : ''}`}>
                          {collapsedCategories.has(category) ? (
                            <ChevronRight className={`text-glass-muted ${isShoppingMode ? 'w-6 h-6' : 'w-4 h-4'}`} />
                          ) : (
                            <ChevronDown className={`text-glass-muted ${isShoppingMode ? 'w-6 h-6' : 'w-4 h-4'}`} />
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Category Items */}
                  <div 
                    className={`category-collapsible ${isShoppingMode ? "space-y-2 p-2" : "divide-y divide-glass-white-border"} ${
                      collapsedCategories.has(category) ? 'collapsed' : 'expanded'
                    }`}
                  >
                      {categoryItems.map((item: any) => (
                      isShoppingMode ? (
                        // Shopping Mode Layout - Large, touch-friendly
                        <button
                          key={item.id} 
                          onClick={() => handleToggleItem(item.id)}
                          className={`w-full p-4 rounded-xl transition-all duration-200 text-left ${
                            item.is_checked 
                              ? 'opacity-60 bg-green-50/50 border-2 border-green-200/50' 
                              : 'bg-glass-white-light hover:bg-white/40 border-2 border-transparent hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-6">
                            {/* Large Circular Checkbox */}
                            <div
                              className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all flex-shrink-0 shadow-lg ${
                                item.is_checked 
                                  ? 'bg-green-500 border-green-500 transform scale-110' 
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {item.is_checked && <Check className="w-8 h-8 text-white stroke-[3]" />}
                            </div>
                            
                            {/* Item Image - Larger in shopping mode */}
                            {item.image_url && (
                              <div className="flex-shrink-0">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-xl glass-card shadow-md"
                                />
                              </div>
                            )}
                            
                            {/* Item Details - Large and readable */}
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <h4 className={`text-2xl font-semibold ${item.is_checked ? 'line-through text-gray-500' : 'text-glass-heading'}`}>
                                  {item.name}
                                </h4>
                                <p className="text-lg text-glass-muted mt-1">
                                  {item.amount} {item.unit}
                                </p>
                              </div>
                              {item.notes && (
                                <p className="text-base text-glass-muted">{item.notes}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ) : (
                        // Normal Mode Layout - Compact
                        <div 
                          key={item.id} 
                          className={`category-list-item flex items-center gap-3 p-3 transition-all duration-300 text-sm border-b border-glass-white-border last:border-b-0 bg-white/30 hover:bg-glass-white-light hover:shadow-lg animate-list-item hover-lift ${item.is_checked ? 'opacity-60' : ''} cursor-pointer`}
                          style={{ animationDelay: `${categoryItems.indexOf(item) * 0.05}s` }}
                          onClick={() => handleToggleItem(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToggleItem(item.id)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`${item.is_checked ? 'Uncheck' : 'Check'} ${item.name}`}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleItem(item.id)
                            }}
                            className={`category-checkbox w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mr-2 ${item.is_checked ? 'bg-green-500 border-green-500' : 'border-glass-white-border hover:border-primary'}`}
                            aria-label={item.is_checked ? 'Uncheck item' : 'Check item'}
                          >
                            {item.is_checked && <Check className="w-4 h-4 text-white" />}
                          </button>
                          {item.image_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg glass-card"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium truncate ${item.is_checked ? 'line-through' : ''} text-glass-heading`}>
                                {item.name}
                              </span>
                              <span className="text-glass-muted whitespace-nowrap">
                                {item.amount} {item.unit}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-glass-muted mt-1 truncate">{item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditItem(item)
                              }}
                              className="p-2 hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                              title="Edit item"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteItem(item.id)
                              }}
                              className="p-2 hover:bg-red-100/20 rounded-lg transition-colors flex-shrink-0"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )
            })
          )}



        {/* Edit Item Modal */}
        {showEditItem && editingItem && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in"
            onClick={() => {
              setShowEditItem(false)
              setEditingItem(null)
            }}
          >
            <div 
              className="glass-premium p-8 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-scale-in hover-lift custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center animate-bounce-in">
                  <Edit className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-glass-heading bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Edit Item</h3>
              </div>
              
              <div className="space-y-5">
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-glass-muted mb-2 animate-fade-in">Item Name</label>
                  <input
                    type="text"
                    value={editItemForm.name}
                    onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                    className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted focus-ring transition-all duration-300 hover:shadow-lg"
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-1">
                  <div>
                    <label className="block text-sm font-medium text-glass-muted mb-2">Amount</label>
                    <div className="flex items-stretch glass-premium rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setEditItemForm((prev) => ({ ...prev, amount: Math.max(1, prev.amount - 1) }))
                        }
                        className="px-3 bg-glass-white-light/30 text-glass-muted hover:bg-glass-white-light/50 focus:outline-none transition-colors duration-200"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editItemForm.amount}
                        onChange={(e) =>
                          setEditItemForm({ ...editItemForm, amount: parseInt(e.target.value) || 1 })
                        }
                        className="w-full border-0 bg-glass-white-light/20 text-center px-4 py-3 focus:ring-0 text-glass focus:bg-glass-white-light/30 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditItemForm((prev) => ({ ...prev, amount: prev.amount + 1 }))
                        }
                        className="px-3 bg-glass-white-light/30 text-glass-muted hover:bg-glass-white-light/50 focus:outline-none transition-colors duration-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-glass-muted mb-2">Unit</label>
                    <select
                      value={editItemForm.unit}
                      onChange={(e) => setEditItemForm({ ...editItemForm, unit: e.target.value })}
                      className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass focus-ring transition-all duration-300 hover:shadow-lg"
                    >
                      <option value="pcs">Piece</option>
                      <option value="lb">Pound</option>
                      <option value="kg">Kilogram</option>
                      <option value="oz">Ounce</option>
                      <option value="g">Gram</option>
                      <option value="cup">Cup</option>
                      <option value="L">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="dozen">Dozen</option>
                      <option value="bunch">Bunch</option>
                      <option value="pack">Package</option>
                      <option value="box">Box</option>
                      <option value="bottle">Bottle</option>
                      <option value="can">Can</option>
                      <option value="bag">Bag</option>
                    </select>
                  </div>
                </div>
                
                <div className="animate-slide-up stagger-2">
                  <label className="block text-sm font-medium text-glass-muted mb-2">Category</label>
                  <select
                    value={editItemForm.category}
                    onChange={(e) => setEditItemForm({ ...editItemForm, category: e.target.value })}
                    className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass focus-ring transition-all duration-300 hover:shadow-lg"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Hygiene">Hygiene</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Household">Household</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Organics">Organics</option>
                    <option value="Registers">Registers</option>
                    <option value="Canned Goods">Canned Goods</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="animate-slide-up stagger-3">
                  <label className="block text-sm font-medium text-glass-muted mb-2">Notes</label>
                  <input
                    type="text"
                    value={editItemForm.notes}
                    onChange={(e) => setEditItemForm({ ...editItemForm, notes: e.target.value })}
                    className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted focus-ring transition-all duration-300 hover:shadow-lg"
                    placeholder="Optional notes"
                  />
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-glass-muted mb-2">Item Photo</label>
                  
                  {!imagePreview && !editItemForm.image_url ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="edit-image-upload"
                      />
                      <label
                        htmlFor="edit-image-upload"
                        className="glass-button border-2 border-dashed border-glass-white-light rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-glass-muted mb-2" />
                        <span className="text-glass-muted text-sm">Click to add photo</span>
                        <span className="text-glass-muted text-xs mt-1">Max 5MB • JPG, PNG, WebP</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || editItemForm.image_url || ''}
                        alt="Item preview"
                        className="w-24 h-24 object-cover rounded-lg glass-card"
                      />
                      <button
                        onClick={() => {
                          if (imagePreview) {
                            revokeImagePreview(imagePreview)
                          }
                          setSelectedImage(null)
                          setImagePreview(null)
                          setEditItemForm({ ...editItemForm, image_url: null })
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 animate-slide-up stagger-5">
                <button 
                  onClick={handleSaveItem}
                  disabled={!editItemForm.name.trim() || isUploading}
                  className="glass-premium px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 disabled:opacity-50 flex items-center gap-2 hover-lift micro-interaction transition-all duration-300"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowEditItem(false)
                    setEditingItem(null)
                    if (imagePreview) {
                      revokeImagePreview(imagePreview)
                    }
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="glass-premium px-6 py-3 hover-lift micro-interaction"
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sharing Panel */}
        {showSharing && list.is_shared && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={() => setShowSharing(false)}
          >
            <div 
              className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-glass-heading mb-4">Share List</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-glass-muted">Share Code</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={list.share_code}
                      readOnly
                      className="flex-1 glass border-0 rounded-lg px-3 py-2 text-glass"
                    />
                    <button 
                      onClick={handleShareList}
                      className="glass-button p-2"
                      title="Copy share link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-glass-muted">Members ({list.list_members?.length || 0})</label>
                  <div className="space-y-2 mt-2">
                    {list.list_members?.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 glass rounded-lg">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {member.profiles.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-glass">{member.profiles.full_name}</p>
                          <p className="text-xs text-glass-muted">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleShareList}
                  className="glass-button px-4 py-2 bg-primary/20 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Link
                </button>
                <button 
                  onClick={() => setShowSharing(false)}
                  className="glass-button px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Quick Add Modal */}
        {showAiAdd && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in"
            onClick={() => {
              setShowAiAdd(false)
              setAiInput('')
              resetVoiceRecording()
            }}
          >
            <div 
              className="glass-premium p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-scale-in hover-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-bounce-in">
                  <Sparkles className="w-7 h-7 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-glass-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Quick Add</h3>
                  <p className="text-sm text-glass-muted animate-slide-up">Parse your shopping list with AI magic</p>
                </div>
              </div>
              
              {/* Input Mode Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-glass-white-light rounded-xl animate-slide-up">
                <button
                  onClick={() => setAiInputMode('text')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    aiInputMode === 'text'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg animate-pulse-glow'
                      : 'text-glass-muted hover:text-glass hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Type className="w-4 h-4" />
                    Text Input
                  </div>
                </button>
                <button
                  onClick={() => setAiInputMode('voice')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    aiInputMode === 'voice'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg animate-pulse-glow'
                      : 'text-glass-muted hover:text-glass hover:bg-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Mic className="w-4 h-4" />
                    Voice Recording
                  </div>
                </button>
              </div>
              
              <div className="space-y-4">
                {aiInputMode === 'text' ? (
                  <div className="animate-slide-up">
                    <label className="block text-sm font-medium text-glass-muted mb-2 animate-fade-in">
                      Natural Language Input
                    </label>
                    <p className="text-sm text-glass-muted mb-3 animate-slide-up stagger-1">
                      Enter items naturally like: <span className="font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">"2 lbs chicken breast, 1 gallon milk, 3 apples"</span>
                    </p>
                    <textarea
                      placeholder="Type your shopping list items..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      className="w-full glass-premium border-0 rounded-xl px-5 py-4 text-glass placeholder-glass-muted resize-none focus-ring transition-all duration-300 hover:shadow-lg animate-scale-in"
                      rows={4}
                      autoFocus
                    />
                    
                    {isDemoMode && (
                      <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-700">
                          <strong>Demo Mode:</strong> AI will simulate parsing by splitting your input into individual items.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-glass-muted mb-2">
                      Voice Recording
                    </label>
                    <p className="text-sm text-glass-muted mb-3">
                      Speak your shopping list items clearly and naturally.
                    </p>
                    
                    {!audioBlob ? (
                      <div className="text-center py-6">
                        <div className="mb-4">
                          <p className="text-sm text-glass-muted mb-4">
                            Click the microphone button to start recording. Speak clearly and list your items naturally.
                          </p>
                          <p className="text-xs text-glass-muted">
                            Example: "2 pounds of chicken breast, 1 gallon of milk, 3 apples, and a loaf of bread"
                          </p>
                        </div>
                        
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isRecording && !mediaRecorder}
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isRecording 
                              ? 'bg-red-500 animate-pulse' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                          }`}
                        >
                          {isRecording ? (
                            <Square className="w-8 h-8 text-white" />
                          ) : (
                            <Mic className="w-8 h-8 text-white" />
                          )}
                        </button>
                        
                        {isRecording && (
                          <p className="text-sm text-red-500 mt-2 animate-pulse">
                            Recording... Click to stop
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-glass-muted mb-4">
                            Recording complete! Review your audio and process it.
                          </p>
                          
                          {audioUrl && (
                            <audio 
                              controls 
                              className="w-full mb-4"
                              src={audioUrl}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={processVoiceRecording}
                            disabled={isProcessingVoice || !profile?.gemini_api_key}
                            className="flex-1 glass-button px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-purple-700 font-medium"
                          >
                            {isProcessingVoice ? (
                              <>
                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Analyze Recording
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={resetVoiceRecording}
                            className="glass-button px-4 py-2"
                            disabled={isProcessingVoice}
                          >
                            Record Again
                          </button>
                        </div>
                        
                        {!profile?.gemini_api_key && (
                          <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-lg p-3">
                            <p className="text-sm text-yellow-700">
                              <strong>API Key Required:</strong> Please add your Gemini API key in Settings to use voice analysis.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-8 animate-slide-up stagger-2">
                {aiInputMode === 'text' ? (
                  <button 
                    onClick={handleAiAdd}
                    disabled={isAiProcessing || !aiInput.trim()}
                    className="flex-1 glass-premium px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-purple-700 font-medium hover-lift micro-interaction transition-all duration-300 animate-pulse-glow"
                  >
                    {isAiProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        Add Items
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex-1" />
                )}
                <button 
                  onClick={() => {
                    setShowAiAdd(false)
                    setAiInput('')
                    resetVoiceRecording()
                  }}
                  className="glass-premium px-6 py-3 hover-lift micro-interaction"
                  disabled={isAiProcessing || isProcessingVoice}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItem && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in"
            onClick={() => {
              setShowAddItem(false)
              handleRemoveImage()
            }}
          >
            <div 
              className="glass-premium p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-scale-in hover-lift custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center animate-bounce-in">
                  <Plus className="w-7 h-7 text-green-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-glass-heading bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Add New Item</h3>
                  <p className="text-sm text-glass-muted animate-slide-up">Add an item to your shopping list</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-glass-muted mb-2 animate-fade-in">Item Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter item name"
                      value={newItem.name}
                      onChange={(e) => {
                        const newName = e.target.value
                        setNewItem({ ...newItem, name: newName })
                        handleAutoPopulate(newName)
                      }}
                      className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted focus-ring transition-all duration-300 hover:shadow-lg"
                      autoFocus
                    />
                    {isAutoPopulating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {profile?.ai_auto_populate_enabled && (
                    <p className="text-xs text-glass-muted mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI will auto-fill details as you type
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 animate-slide-up stagger-1">
                  <div>
                    <label className="block text-sm font-medium text-glass-muted mb-2">Amount</label>
                    <div className="flex items-stretch glass-premium rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setNewItem((prev) => ({ ...prev, amount: Math.max(1, prev.amount - 1) }))
                        }
                        className="px-3 bg-glass-white-light/30 text-glass-muted hover:bg-glass-white-light/50 focus:outline-none transition-colors duration-200"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newItem.amount}
                        onChange={(e) =>
                          setNewItem({ ...newItem, amount: parseInt(e.target.value) || 1 })
                        }
                        className="w-full border-0 bg-glass-white-light/20 text-center px-4 py-3 focus:ring-0 text-glass focus:bg-glass-white-light/30 transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewItem((prev) => ({ ...prev, amount: prev.amount + 1 }))
                        }
                        className="px-3 bg-glass-white-light/30 text-glass-muted hover:bg-glass-white-light/50 focus:outline-none transition-colors duration-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-glass-muted mb-2">Unit</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full glass-premium border-0 rounded-lg px-4 py-3 text-glass focus-ring transition-all duration-300 hover:shadow-lg"
                    >
                      <option value="pcs">Piece</option>
                      <option value="lb">Pound</option>
                      <option value="kg">Kilogram</option>
                      <option value="oz">Ounce</option>
                      <option value="g">Gram</option>
                      <option value="cup">Cup</option>
                      <option value="L">Liter</option>
                      <option value="ml">Milliliter</option>
                      <option value="dozen">Dozen</option>
                      <option value="bunch">Bunch</option>
                      <option value="pack">Package</option>
                      <option value="box">Box</option>
                      <option value="bottle">Bottle</option>
                      <option value="can">Can</option>
                      <option value="bag">Bag</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-glass-muted mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full glass border-0 rounded-lg px-4 py-2 text-glass focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Meat">Meat</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Hygiene">Hygiene</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Household">Household</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Organics">Organics</option>
                    <option value="Registers">Registers</option>
                    <option value="Canned Goods">Canned Goods</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-glass-muted mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add any notes..."
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    className="w-full glass border-0 rounded-lg px-4 py-2 text-glass placeholder-glass-muted focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-glass-muted mb-2">Item Photo (Optional)</label>
                  
                  {!imagePreview ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="add-item-image-upload"
                      />
                      <label
                        htmlFor="add-item-image-upload"
                        className="glass-button border-2 border-dashed border-glass-white-light rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-green-500/50 transition-colors w-full"
                      >
                        <Camera className="w-6 h-6 text-glass-muted mb-2" />
                        <span className="text-glass-muted text-sm">Click to add photo</span>
                        <span className="text-glass-muted text-xs mt-1">Max 5MB • JPG, PNG, WebP</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Item preview"
                        className="w-24 h-24 object-cover rounded-lg glass-card"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleAddItem}
                  disabled={!newItem.name.trim() || isUploading}
                  className="flex-1 glass-button px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-green-700 font-medium"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Item
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowAddItem(false)
                    handleRemoveImage()
                    setNewItem({ name: '', amount: 1, unit: 'pcs', category: 'Other', notes: '', image_url: null })
                  }}
                  className="glass-button px-4 py-2"
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List Export Modal */}
        {showListExport && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={() => setShowListExport(false)}
          >
            <div 
              className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export "{list.name}"
              </h3>
              
              <div className="mb-6">
                <p className="text-glass-muted text-sm mb-4">
                  Export this shopping list to a JSON file that can be imported later or shared with others.
                </p>
                
                <div className="space-y-3">
                  <div className="p-3 glass rounded-lg">
                    <h4 className="font-medium text-glass-heading text-sm mb-1">What's included:</h4>
                    <ul className="text-xs text-glass-muted space-y-1">
                      <li>• List name and description</li>
                      <li>• All {items.length} items with details</li>
                      <li>• Categories and completion status</li>
                      <li>• Notes and quantities</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 glass rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-primary" />
                      <span className="font-medium text-glass-heading text-sm">Export Summary</span>
                    </div>
                    <p className="text-xs text-glass-muted">
                      {items.length} items • {items.filter(i => i.is_checked).length} completed • {Array.from(new Set(items.map(i => i.category))).length} categories
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleExportList}
                  className="flex-1 glass-button px-4 py-2 bg-primary/20 flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  Export List
                </button>
                <button 
                  onClick={() => setShowListExport(false)}
                  className="flex-1 glass-button px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List Import Modal */}
        {showListImport && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={() => {
              setShowListImport(false)
              setImportFile(null)
            }}
          >
            <div 
              className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Items to "{list.name}"
              </h3>
              
              <div className="mb-6">
                <p className="text-glass-muted text-sm mb-4">
                  Import items from a previously exported shopping list file. Items will be added to this list.
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
                  onClick={handleImportToList}
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
                      Import Items
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowListImport(false)
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
                  <li>• Single list exports (.json)</li>
                  <li>• Bulk list exports (first list)</li>
                  <li>• Files with items array</li>
                </ul>
              </div>
            </div>
          </div>
        )}



        {/* Voice Results Modal */}
        {showVoiceResults && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={() => {
              setShowVoiceResults(false);
              setAiInputMode('text');
            }}
          >
            <div 
              className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-glass-heading">Voice Analysis Results</h3>
                  <p className="text-sm text-glass-muted">Review and edit the items found in your recording</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {voiceParsedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-glass-muted mx-auto mb-4" />
                    <p className="text-glass-muted">No items were found in your recording.</p>
                    <p className="text-sm text-glass-muted mt-2">Try recording again with clearer speech.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {voiceParsedItems.map((item, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedVoiceItems.has(index.toString())
                            ? 'border-green-500 bg-green-50/20'
                            : 'border-glass-white-border bg-glass-white-light'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleVoiceItemToggle(index.toString())}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedVoiceItems.has(index.toString())
                                ? 'bg-green-500 border-green-500'
                                : 'border-glass-white-border hover:border-green-500'
                            }`}
                          >
                            {selectedVoiceItems.has(index.toString()) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-glass-heading">{item.name}</span>
                              <span className="text-sm text-glass-muted">
                                {item.amount} {item.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                              {item.notes && (
                                <span className="text-xs text-glass-muted">{item.notes}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleAddVoiceItems}
                  disabled={selectedVoiceItems.size === 0}
                  className="flex-1 glass-button px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-green-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Selected Items ({selectedVoiceItems.size})
                </button>
                <button 
                  onClick={() => {
                    setShowVoiceResults(false)
                    setVoiceParsedItems([])
                    setSelectedVoiceItems(new Set())
                    setAiInputMode('text')
                  }}
                  className="glass-button px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice Fallback Modal */}
        {showVoiceFallback && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
            onClick={() => {
              setShowVoiceFallback(false)
              setVoiceFallbackInput('')
            }}
          >
            <div 
              className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto m-auto shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-glass-heading">Voice Analysis Failed</h3>
                  <p className="text-sm text-glass-muted">Try typing your items instead</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-glass-muted mb-2">
                    Type Your Shopping List
                  </label>
                  <p className="text-sm text-glass-muted mb-3">
                    Enter items naturally like: <span className="font-medium">"2 lbs chicken breast, 1 gallon milk, 3 apples"</span>
                  </p>
                  <textarea
                    placeholder="Type your shopping list items..."
                    value={voiceFallbackInput}
                    onChange={(e) => setVoiceFallbackInput(e.target.value)}
                    className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted resize-none focus:ring-2 focus:ring-orange-500/50"
                    rows={4}
                    autoFocus
                  />
                </div>
                
                {isDemoMode && (
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Demo Mode:</strong> AI will simulate parsing by splitting your input into individual items.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={handleVoiceFallback}
                  disabled={isProcessingVoice || !voiceFallbackInput.trim()}
                  className="flex-1 glass-button px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2 text-orange-700 font-medium"
                >
                  {isProcessingVoice ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Parse Items
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowVoiceFallback(false)
                    setVoiceFallbackInput('')
                    setAiInputMode('text')
                    resetVoiceRecording()
                  }}
                  className="glass-button px-4 py-2"
                  disabled={isProcessingVoice}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}