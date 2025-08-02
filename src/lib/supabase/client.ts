import { createClient } from '@supabase/supabase-js'
import type { Database, ShoppingList, Item, NewItem, UpdateItem, ShoppingListWithMembers } from './types'
import { getCurrentUser } from './auth'

// Import offline-first client
import * as offlineClient from '@/lib/offline/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export const createSupabaseClient = () => {
  if (isDemoMode || !supabaseUrl || !supabaseKey) {
    // Return a mock client for demo mode
    console.warn('Running in demo mode - Supabase not configured')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export const supabase = createSupabaseClient()

// Helper function to update shopping list timestamp
async function updateListTimestamp(listId: string) {
  if (!supabase) {
    console.error('Cannot update list timestamp: Supabase client not available')
    return
  }
  
  try {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)
    
    if (error) {
      console.error('Failed to update list timestamp:', error)
    }
  } catch (err) {
    console.error('Error updating list timestamp:', err)
  }
}

// Re-export offline client functions for backward compatibility
export const getShoppingLists = offlineClient.getShoppingLists
export const getShoppingList = offlineClient.getShoppingList  
export const updateShoppingList = offlineClient.updateShoppingList
export const deleteShoppingList = offlineClient.deleteShoppingList
export const getListItems = offlineClient.getListItems
export const createItem = offlineClient.createItem
export const createManyItems = offlineClient.createManyItems
export const updateItem = offlineClient.updateItem
export const deleteItem = offlineClient.deleteItem
export const toggleItemChecked = offlineClient.toggleItemChecked
export const updateCategoryOrder = offlineClient.updateCategoryOrder
export const getUserAnalytics = offlineClient.getUserAnalytics

// =============================================
// ORIGINAL SUPABASE OPERATIONS (for fallback)
// =============================================

// Original Supabase functions kept for fallback/legacy support
export async function getShoppingListsOriginal(userId: string) {
  if (!supabase) {
    console.error('Supabase client not available')
    return { data: null, error: 'Supabase not available' }
  }

  try {
    // Fetch lists with their items using a join
    const { data, error } = await supabase
      .from('shopping_lists')
      .select(`
        id, 
        user_id, 
        name, 
        description, 
        is_shared, 
        is_archived, 
        created_at, 
        updated_at,
        items (
          id,
          name,
          amount,
          unit,
          category,
          notes,
          image_url,
          is_checked,
          position,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('getShoppingLists Supabase error:', error)
      return { data: null, error: error.message || 'Database query failed' }
    }

    // Transform the data to match expected format
    const listsWithItems = (data || []).map(list => ({
      ...list,
      items: list.items || []
    }))

    return { data: listsWithItems, error: null }

  } catch (error) {
    console.error('getShoppingLists unexpected error:', error)
    return { data: null, error: 'Unexpected error occurred' }
  }
}

export async function getShoppingListOriginal(listId: string) {
  if (!supabase) {
    console.error('Supabase client not available')
    return { data: null, error: 'Supabase not available' }
  }

  try {
    // Simplified query without the complex join that might be causing 400 error
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', listId)
      .single()

    if (error) {
      console.error('getShoppingList Supabase error:', error)
      return { data: null, error: error.message || 'Failed to fetch list' }
    }

    // For now, return the list without members - we can add this back later
    const listWithEmptyMembers = {
      ...data,
      list_members: []
    }

    return { data: listWithEmptyMembers, error: null }

  } catch (error) {
    console.error('getShoppingList unexpected error:', error)
    return { data: null, error: 'Unexpected error occurred' }
  }
}

export async function updateShoppingListOriginal(listId: string, updates: Partial<ShoppingList>) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', listId)
    .select()
    .single()

  return { data, error }
}

export async function updateCategoryOrderOriginal(listId: string, categoryOrder: string[]) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  const { data, error } = await supabase
    .from('shopping_lists')
    .update({ category_order: categoryOrder })
    .eq('id', listId)
    .select()
    .single()

  return { data, error }
}

export async function deleteShoppingListOriginal(listId: string) {
  if (!supabase) return { error: 'Supabase not available' }

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', listId)

  return { error }
}

export async function getShoppingListByShareCode(shareCode: string) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      id,
      name,
      description,
      user_id,
      created_at,
      list_members(count),
      items(count)
    `)
    .eq('share_code', shareCode)
    .eq('is_shared', true)
    .single()

  return { data, error }
}

// =============================================
// ITEM OPERATIONS
// =============================================

export async function getListItemsOriginal(listId: string) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  try {
    // First verify the user owns the list (application-level security)
    const { user } = await getCurrentUser()
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Check if user owns the list
    const { data: listCheck, error: listError } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', listId)
      .single()

    if (listError || !listCheck || listCheck.user_id !== user.id) {
      return { data: null, error: 'Access denied to this list' }
    }

    // Now fetch items (RLS is disabled on items, so we rely on the list ownership check above)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    return { data, error }

  } catch (error) {
    console.error('getListItems unexpected error:', error)
    return { data: null, error: 'Unexpected error occurred' }
  }
}

export async function createItemOriginal(item: NewItem) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  try {
    // Application-level security: verify user owns the list
    const { user } = await getCurrentUser()
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Check if user owns the list
    const { data: listCheck, error: listError } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', item.list_id)
      .single()

    if (listError || !listCheck || listCheck.user_id !== user.id) {
      return { data: null, error: 'Access denied to this list' }
    }

    // Prepare item data with proper types
    const itemToInsert = {
      list_id: item.list_id,
      name: item.name.trim(),
      amount: Number(item.amount) || 1,
      unit: item.unit || 'pcs',  // Default to 'pcs' if undefined
      category: item.category || 'Other',
      notes: item.notes?.trim() || null,
      image_url: item.image_url || null,
      is_checked: Boolean(item.is_checked),
      position: item.position || 0
    }

    // Create the item
    const { data, error } = await supabase
      .from('items')
      .insert(itemToInsert)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      // Return a readable error message
      const errorMessage = error.message || 'Failed to create item'
      return { data: null, error: errorMessage }
    }

    // Update the list's timestamp
    if (data) {
      await updateListTimestamp(item.list_id)
    }

    return { data, error: null }

  } catch (error) {
    console.error('createItem unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred'
    return { data: null, error: errorMessage }
  }
}

export async function createManyItemsOriginal(items: NewItem[]) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  const { data, error } = await supabase
    .from('items')
    .insert(items)
    .select()

  return { data, error }
}

export async function updateItemOriginal(itemId: string, updates: UpdateItem) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  try {
    // Application-level security: verify user owns the list that contains this item
    const { user } = await getCurrentUser()
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get the item's list_id and verify ownership
    const { data: itemCheck, error: itemError } = await supabase
      .from('items')
      .select(`
        list_id,
        shopping_lists!inner(user_id)
      `)
      .eq('id', itemId)
      .single()

    if (itemError || !itemCheck) {
      return { data: null, error: 'Item not found' }
    }

    // TypeScript might complain about the nested structure, so let's be safe
    const listUserId = (itemCheck as any).shopping_lists?.user_id
    if (listUserId !== user.id) {
      return { data: null, error: 'Access denied to this item' }
    }

    // Update the item
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()

    // Update the list's timestamp
    if (data && !error) {
      await updateListTimestamp(itemCheck.list_id)
    }

    return { data, error }

  } catch (error) {
    console.error('updateItem unexpected error:', error)
    return { data: null, error: 'Unexpected error occurred' }
  }
}

export async function toggleItemCheckedOriginal(itemId: string, isChecked: boolean) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  const { data, error } = await supabase
    .from('items')
    .update({ is_checked: isChecked })
    .eq('id', itemId)
    .select()
    .single()

  return { data, error }
}

export async function deleteItemOriginal(itemId: string) {
  if (!supabase) return { error: 'Supabase not available' }

  try {
    // First get the list_id before deleting
    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('list_id')
      .eq('id', itemId)
      .single()
    
    if (fetchError || !item) {
      return { error: fetchError || 'Item not found' }
    }

    // Delete the item
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    // Update the list's timestamp if deletion was successful
    if (!error && item.list_id) {
      await updateListTimestamp(item.list_id)
    }

    return { error }
  } catch (error) {
    console.error('deleteItem unexpected error:', error)
    return { error: 'Unexpected error occurred' }
  }
}

// =============================================
// ANALYTICS OPERATIONS
// =============================================

export async function getUserAnalyticsOriginal(userId: string) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  try {
    const { data, error } = await supabase
      .rpc('get_user_analytics', { user_uuid: userId })

    return { data, error }
  } catch (error) {
    console.error('Analytics error:', error)
    return { data: null, error: 'Failed to load analytics' }
  }
}

// =============================================
// LIST SHARING OPERATIONS
// =============================================

export async function joinListByShareCode(shareCode: string, userId: string) {
  if (!supabase) return { data: null, error: 'Supabase not available' }

  // First, find the list by share code
  const { data: list, error: listError } = await getShoppingListByShareCode(shareCode)
  if (listError || !list) {
    return { data: null, error: 'Invalid or expired share code' }
  }

  // Check if user is already a member
  const { data: existingMember, error: memberError } = await supabase
    .from('list_members')
    .select('id')
    .eq('list_id', list.id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    return { data: { list_id: list.id, already_member: true }, error: null }
  }

  // Add user as a member
  const { data: newMember, error: insertError } = await supabase
    .from('list_members')
    .insert({
      list_id: list.id,
      user_id: userId,
      role: 'editor'
    })
    .select()
    .single()

  if (insertError) {
    return { data: null, error: 'Failed to join list' }
  }

  return { data: { list_id: list.id, already_member: false }, error: null }
} 