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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          expires_at: string | null
          id: string
          max_uses: number | null
          plan_type: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          plan_type?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          plan_type?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_time_blocks: {
        Row: {
          category: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedule_entries: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          linked_time_block_id: string | null
          location: string | null
          recurrence_pattern: Json | null
          source: string | null
          start_time: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          linked_time_block_id?: string | null
          location?: string | null
          recurrence_pattern?: Json | null
          source?: string | null
          start_time: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          linked_time_block_id?: string | null
          location?: string | null
          recurrence_pattern?: Json | null
          source?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_linked_time_block_id_fkey"
            columns: ["linked_time_block_id"]
            isOneToOne: false
            referencedRelation: "recurring_time_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_preferences: {
        Row: {
          avoid_late_night: boolean | null
          buffer_minutes: number | null
          created_at: string | null
          id: string
          max_daily_study_hours: number | null
          max_session_length: number | null
          min_session_length: number | null
          preferred_study_end: string | null
          preferred_study_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avoid_late_night?: boolean | null
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_study_hours?: number | null
          max_session_length?: number | null
          min_session_length?: number | null
          preferred_study_end?: string | null
          preferred_study_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avoid_late_night?: boolean | null
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_study_hours?: number | null
          max_session_length?: number | null
          min_session_length?: number | null
          preferred_study_end?: string | null
          preferred_study_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stuck_sessions: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          playbooks_generated: string[] | null
          session_date: string | null
          tasks_created: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          playbooks_generated?: string[] | null
          session_date?: string | null
          tasks_created?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          playbooks_generated?: string[] | null
          session_date?: string | null
          tasks_created?: number | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_status: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_type: Database["public"]["Enums"]["app_role"]
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_metadata: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          last_sync_timestamp: string | null
          pending_changes: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          last_sync_timestamp?: string | null
          pending_changes?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          last_sync_timestamp?: string | null
          pending_changes?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          name: string
          source_schedule_id: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          name: string
          source_schedule_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          name?: string
          source_schedule_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_source_schedule_id_fkey"
            columns: ["source_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          data: Json
          data_type: Database["public"]["Enums"]["data_type_enum"]
          device_id: string | null
          last_modified: string | null
          sync_version: number | null
          user_id: string
        }
        Insert: {
          data?: Json
          data_type: Database["public"]["Enums"]["data_type_enum"]
          device_id?: string | null
          last_modified?: string | null
          sync_version?: number | null
          user_id: string
        }
        Update: {
          data?: Json
          data_type?: Database["public"]["Enums"]["data_type_enum"]
          device_id?: string | null
          last_modified?: string | null
          sync_version?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          message: string
          rating: number | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          message: string
          rating?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          message?: string
          rating?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ai_coaching_style: string | null
          created_at: string | null
          default_sleep_time: string | null
          default_wake_time: string | null
          id: string
          life_domains: Json | null
          living_situation: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          work_schedule: Json | null
        }
        Insert: {
          ai_coaching_style?: string | null
          created_at?: string | null
          default_sleep_time?: string | null
          default_wake_time?: string | null
          id?: string
          life_domains?: Json | null
          living_situation?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          work_schedule?: Json | null
        }
        Update: {
          ai_coaching_style?: string | null
          created_at?: string | null
          default_sleep_time?: string | null
          default_wake_time?: string | null
          id?: string
          life_domains?: Json | null
          living_situation?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          work_schedule?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_todays_schedule: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          description: string
          end_time: string
          id: string
          location: string
          source: string
          start_time: string
          title: string
        }[]
      }
      has_active_promo: { Args: { p_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_promo_code: {
        Args: { code_input: string }
        Returns: {
          already_redeemed: boolean
          plan_type: Database["public"]["Enums"]["app_role"]
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "free" | "premium" | "lifetime" | "admin" | "creator"
      data_type_enum:
        | "tasks"
        | "projects"
        | "priorities"
        | "timeblocks"
        | "scheduledTasks"
        | "playbooks"
        | "reminderWidgets"
        | "energyWidgets"
        | "messengerWidgets"
        | "moodGardenWidgets"
        | "parallelUniverseWidgets"
        | "soundSignatureWidgets"
        | "theme"
        | "customTheme"
        | "customTabs"
        | "timerSessions"
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["free", "premium", "lifetime", "admin", "creator"],
      data_type_enum: [
        "tasks",
        "projects",
        "priorities",
        "timeblocks",
        "scheduledTasks",
        "playbooks",
        "reminderWidgets",
        "energyWidgets",
        "messengerWidgets",
        "moodGardenWidgets",
        "parallelUniverseWidgets",
        "soundSignatureWidgets",
        "theme",
        "customTheme",
        "customTabs",
        "timerSessions",
      ],
    },
  },
} as const
