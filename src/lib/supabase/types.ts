export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      backup_list_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          id: string | null
          invited_by: string | null
          list_id: string | null
          role: string | null
          share_code: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          invited_by?: string | null
          list_id?: string | null
          role?: string | null
          share_code?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          invited_by?: string | null
          list_id?: string | null
          role?: string | null
          share_code?: string | null
        }
        Relationships: []
      }
      backup_list_members: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string | null
          invited_by: string | null
          joined_at: string | null
          last_active_at: string | null
          list_id: string | null
          notification_preferences: Json | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          list_id?: string | null
          notification_preferences?: Json | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          list_id?: string | null
          notification_preferences?: Json | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          is_checked: boolean | null
          list_id: string
          name: string
          notes: string | null
          position: number | null
          unit: Database["public"]["Enums"]["unit_type"] | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_checked?: boolean | null
          list_id: string
          name: string
          notes?: string | null
          position?: number | null
          unit?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_checked?: boolean | null
          list_id?: string
          name?: string
          notes?: string | null
          position?: number | null
          unit?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          id: number
          name: string
          rollback_script: string | null
        }
        Insert: {
          executed_at?: string | null
          id?: number
          name: string
          rollback_script?: string | null
        }
        Update: {
          executed_at?: string | null
          id?: number
          name?: string
          rollback_script?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_auto_populate_enabled: boolean | null
          ai_quick_add_enabled: boolean | null
          ai_voice_enabled: boolean | null
          ai_suggestions_enabled: boolean | null
          ai_analytics_enabled: boolean | null
          ai_tips_enabled: boolean | null
          ai_insights_enabled: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          gemini_api_key: string | null
          id: string
          updated_at: string
        }
        Insert: {
          ai_auto_populate_enabled?: boolean | null
          ai_quick_add_enabled?: boolean | null
          ai_voice_enabled?: boolean | null
          ai_suggestions_enabled?: boolean | null
          ai_analytics_enabled?: boolean | null
          ai_tips_enabled?: boolean | null
          ai_insights_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gemini_api_key?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          ai_auto_populate_enabled?: boolean | null
          ai_quick_add_enabled?: boolean | null
          ai_voice_enabled?: boolean | null
          ai_suggestions_enabled?: boolean | null
          ai_analytics_enabled?: boolean | null
          ai_tips_enabled?: boolean | null
          ai_insights_enabled?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gemini_api_key?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          activity_summary: Json | null
          category_order: Json | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean | null
          last_activity_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_summary?: Json | null
          category_order?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_activity_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_summary?: Json | null
          category_order?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_activity_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_analytics: {
        Args: { user_uuid: string }
        Returns: Json
      }
      log_list_activity: {
        Args: {
          p_activity_type: string
          p_change_summary?: string
          p_item_id?: string
          p_list_id: string
          p_new_values?: Json
          p_old_values?: Json
          p_target_user_id?: string
          p_user_id: string
        }
        Returns: string
      }
      search_user_items: {
        Args: { limit_count?: number; search_term: string; user_uuid: string }
        Returns: {
          category: string
          frequency: number
          name: string
          unit: Database["public"]["Enums"]["unit_type"]
        }[]
      }
      user_has_list_permission: {
        Args: {
          list_id_param: string
          permission_name: string
          user_id_param?: string
        }
        Returns: boolean
      }
      user_is_list_member: {
        Args: { list_id_param: string; user_id_param?: string }
        Returns: boolean
      }
      user_owns_list: {
        Args: { list_id_param: string; user_id_param?: string }
        Returns: boolean
      }
      validate_sharing_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          passed: boolean
          test_name: string
        }[]
      }
    }
    Enums: {
      unit_type:
        | "pcs"
        | "kg"
        | "g"
        | "L"
        | "ml"
        | "pack"
        | "dozen"
        | "box"
        | "jar"
        | "bottle"
        | "can"
        | "bag"
        | "cup"
        | "tbsp"
        | "tsp"
        | "oz"
        | "lb"
        | "bunch"
        | "head"
        | "slice"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenient type aliases
export type Profile = Tables<"profiles">
export type ShoppingList = Tables<"shopping_lists">
export type Item = Tables<"items">
export type UnitType = Database["public"]["Enums"]["unit_type"]

export type NewProfile = TablesInsert<"profiles">
export type NewShoppingList = TablesInsert<"shopping_lists">
export type NewItem = TablesInsert<"items">

export type UpdateProfile = TablesUpdate<"profiles">
export type UpdateShoppingList = TablesUpdate<"shopping_lists">
export type UpdateItem = TablesUpdate<"items">

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

export const Constants = {
  public: {
    Enums: {
      unit_type: [
        "pcs",
        "kg",
        "g",
        "L",
        "ml",
        "pack",
        "dozen",
        "box",
        "jar",
        "bottle",
        "can",
        "bag",
        "cup",
        "tbsp",
        "tsp",
        "oz",
        "lb",
        "bunch",
        "head",
        "slice",
      ],
    },
  },
} as const
