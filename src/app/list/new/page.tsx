'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/lib/toast/context'
import { 
  ArrowLeft, 
  Plus, 
  ShoppingCart, 
  Users, 
  Lock, 
  Globe,
  Save,
  Sparkles,
  Eye,
  Check
} from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createShoppingList, createManyItems, isDemoMode } from '@/lib/offline/client'

export default function NewListPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_shared: false,
    template: 'blank'
  })

  const templates = [
    {
      id: 'blank',
      name: 'Blank List',
      description: 'Start with an empty list',
      icon: Plus,
      items: []
    },
    {
      id: 'groceries',
      name: 'Weekly Groceries',
      description: 'Common grocery items',
      icon: ShoppingCart,
      items: [
        { name: 'Milk', category: 'Dairy' },
        { name: 'Bread', category: 'Bakery' },
        { name: 'Eggs', category: 'Dairy' },
        { name: 'Bananas', category: 'Produce' },
        { name: 'Apples', category: 'Produce' },
        { name: 'Chicken Breast', category: 'Meat' }
      ]
    },
    {
      id: 'party',
      name: 'Party Supplies',
      description: 'Everything for a great party',
      icon: Sparkles,
      items: [
        { name: 'Paper Plates', category: 'Party' },
        { name: 'Napkins', category: 'Party' },
        { name: 'Chips', category: 'Snacks' },
        { name: 'Sodas', category: 'Beverages' },
        { name: 'Ice', category: 'Frozen' },
        { name: 'Party Hats', category: 'Party' }
      ]
    }
  ]

  const handleCreate = async () => {
    if (!formData.name.trim()) return

    setIsCreating(true)

    try {
      if (isDemoMode) {
        // Simulate list creation in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Redirect to the new list (using a demo ID)
        const demoListId = `demo-${Date.now()}`
        toast.success('List created!', `${formData.name} is ready to use`)
        router.push(`/list/${demoListId}`)
      } else {
        // Real implementation: create a new list using offline client
        const { user, error: userError } = await getCurrentUser()
        if (userError || !user) throw new Error('User not found')
        
        const listData = {
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          is_shared: formData.is_shared,
          share_code: formData.is_shared ? Math.random().toString(36).substring(2, 10).toUpperCase() : null
        }
        
        const { data, error } = await createShoppingList(listData)
        
        if (error || !data) throw new Error(error || 'Failed to create list')
        
        // Create template items if a template was selected
        const selectedTemplate = templates.find(t => t.id === formData.template)
        if (selectedTemplate && selectedTemplate.items.length > 0) {
          const templateItems = selectedTemplate.items.map(item => ({
            list_id: data.id,
            name: item.name,
            category: item.category,
            amount: 1,
            unit: 'pcs' as any,
            is_checked: false
          }))
          
          const { error: itemsError } = await createManyItems(templateItems)
          if (itemsError) {
            console.error('Failed to create template items:', itemsError)
            // Continue anyway, just log the error
          }
        }
        
        toast.success('List created!', `${formData.name} is ready to use`)
        router.push(`/list/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Creation failed', 'Failed to create list. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 glass-white rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 glass-white rounded-full blur-3xl opacity-15"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="glass-button p-2">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-glass-heading flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Create New List
              </h1>
              <p className="text-glass-muted">Set up your new shopping list</p>
            </div>
          </div>
        </div>

        {/* List Details */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-glass-heading mb-4">List Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-glass-muted mb-2">
                List Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted"
                placeholder="e.g., Weekly Groceries, Party Supplies"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-glass-muted mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full glass border-0 rounded-lg px-4 py-3 text-glass placeholder-glass-muted resize-none"
                placeholder="Brief description of this list..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
        </div>

        {/* Sharing Settings */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Sharing Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-glass-muted" />
                <div>
                  <h3 className="font-medium text-glass">Private List</h3>
                  <p className="text-sm text-glass-muted">Only you can access this list</p>
                </div>
              </div>
              <input
                type="radio"
                name="sharing"
                checked={!formData.is_shared}
                onChange={() => setFormData({ ...formData, is_shared: false })}
                className="w-4 h-4 text-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-glass-muted" />
                <div>
                  <h3 className="font-medium text-glass">Shared List</h3>
                  <p className="text-sm text-glass-muted">
                    Generate a share link for family and friends
                  </p>
                </div>
              </div>
              <input
                type="radio"
                name="sharing"
                checked={formData.is_shared}
                onChange={() => setFormData({ ...formData, is_shared: true })}
                className="w-4 h-4 text-primary"
              />
            </div>

            {formData.is_shared && (
              <div className="glass p-4 rounded-lg mt-3 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Sharing Enabled</span>
                </div>
                <p className="text-xs text-glass-muted">
                  A unique share code will be generated. You can invite others by sharing this code or link.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Template Selection */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-glass-heading mb-4">Choose a Template</h2>
          
          <div className="grid gap-3">
            {templates.map((template) => {
              const IconComponent = template.icon
              return (
                <div
                  key={template.id}
                  onClick={() => setFormData({ ...formData, template: template.id })}
                  className={`p-4 glass rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                    formData.template === template.id 
                      ? 'border border-primary/30 bg-primary/10' 
                      : 'hover:bg-glass-white-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.template === template.id ? 'bg-primary/20' : 'bg-glass-white-light'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        formData.template === template.id ? 'text-primary' : 'text-glass-muted'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-glass-heading">{template.name}</h3>
                      <p className="text-sm text-glass-muted">{template.description}</p>
                      {template.items.length > 0 && (
                        <p className="text-xs text-glass-muted mt-1">
                          Includes {template.items.length} starter items
                        </p>
                      )}
                    </div>

                    {formData.template === template.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Preview */}
        {formData.template !== 'blank' && (
          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-bold text-glass-heading mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Template Preview
            </h3>
            
            <div className="space-y-2">
              {templates.find(t => t.id === formData.template)?.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 glass rounded">
                  <div className="w-4 h-4 border border-glass-white-border rounded"></div>
                  <span className="text-glass flex-1">{item.name}</span>
                  <span className="text-xs text-glass-muted bg-primary/20 px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-glass-muted mt-3">
              You can add, edit, or remove items after creating the list.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="glass-button px-6 py-3"
            >
              Cancel
            </Link>
            
            <button 
              onClick={handleCreate}
              disabled={!formData.name.trim() || isCreating}
              className="glass-button px-6 py-3 bg-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create List
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 