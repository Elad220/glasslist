export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          gemini_api_key: string | null
          ai_suggestions_enabled: boolean
          ai_insights_enabled: boolean
          ai_tips_enabled: boolean
          ai_analytics_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          gemini_api_key?: string | null
          ai_suggestions_enabled?: boolean
          ai_insights_enabled?: boolean
          ai_tips_enabled?: boolean
          ai_analytics_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          gemini_api_key?: string | null
          ai_suggestions_enabled?: boolean
          ai_insights_enabled?: boolean
          ai_tips_enabled?: boolean
          ai_analytics_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shopping_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_archived: boolean
          category_order: Json | null
          is_shared: boolean | null
          share_code: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_archived?: boolean
          category_order?: Json | null
          is_shared?: boolean | null
          share_code?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_archived?: boolean
          category_order?: Json | null
          is_shared?: boolean | null
          share_code?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_members: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: string
          joined_at: string
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role?: string
          joined_at?: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          role?: string
          joined_at?: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_invitations: {
        Row: {
          id: string
          list_id: string
          email: string
          role: string
          invited_by: string | null
          share_code: string | null
          expires_at: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          email: string
          role?: string
          invited_by?: string | null
          share_code?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          email?: string
          role?: string
          invited_by?: string | null
          share_code?: string | null
          expires_at?: string | null
          accepted_at?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          list_id: string
          name: string
          amount: number
          unit: UnitType
          category: string
          notes: string | null
          image_url: string | null
          is_checked: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          amount?: number
          unit?: UnitType
          category?: string
          notes?: string | null
          image_url?: string | null
          is_checked?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          amount?: number
          unit?: UnitType
          category?: string
          notes?: string | null
          image_url?: string | null
          is_checked?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_analytics: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
      search_user_items: {
        Args: {
          user_uuid: string
          search_term: string
          limit_count?: number
        }
        Returns: {
          name: string
          category: string
          unit: UnitType
          frequency: number
        }[]
      }
    }
    Enums: {
      unit_type: UnitType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UnitType = 
  | 'pcs' | 'kg' | 'g' | 'L' | 'ml' | 'pack' | 'dozen' | 'box' | 'jar' | 'bottle'
  | 'can' | 'bag' | 'cup' | 'tbsp' | 'tsp' | 'oz' | 'lb' | 'bunch' | 'head' | 'slice'

// Convenient type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type Item = Database['public']['Tables']['items']['Row']

export type NewProfile = Database['public']['Tables']['profiles']['Insert']
export type NewShoppingList = Database['public']['Tables']['shopping_lists']['Insert']
export type NewItem = Database['public']['Tables']['items']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateShoppingList = Database['public']['Tables']['shopping_lists']['Update']
export type UpdateItem = Database['public']['Tables']['items']['Update']

// Extended types with relations
export type ShoppingListWithItems = ShoppingList & {
  items: Item[]
}

export type ShoppingListWithCounts = ShoppingList & {
  itemCount: number
  completedCount: number
}

export type ItemWithList = Item & {
  shopping_list: ShoppingList
}

// Sharing types
export type ListMember = Database['public']['Tables']['list_members']['Row']
export type NewListMember = Database['public']['Tables']['list_members']['Insert']
export type UpdateListMember = Database['public']['Tables']['list_members']['Update']

export type ListInvitation = Database['public']['Tables']['list_invitations']['Row']
export type NewListInvitation = Database['public']['Tables']['list_invitations']['Insert']
export type UpdateListInvitation = Database['public']['Tables']['list_invitations']['Update']

// Extended types with relationships
export type ShoppingListWithMembers = ShoppingList & {
  list_members: Array<ListMember & {
    profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url'>
  }>
  user_role?: string
}

export type ListMemberWithProfile = ListMember & {
  profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url'>
}

// Analytics types
export type UserAnalytics = {
  total_lists: number
  total_items: number
  completed_items: number
  items_this_month: number
  most_frequent_category: string | null
  most_frequent_items: Array<{
    name: string
    count: number
  }> | null
} 