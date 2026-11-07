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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          plan: string
          points_per_real: number
          points_photo: number
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          plan?: string
          points_per_real?: number
          points_photo?: number
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          plan?: string
          points_per_real?: number
          points_photo?: number
          slug?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          points_balance: number
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          points_balance?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          points_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_submissions: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          id: string
          image_path: string
          instagram_handle: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["photo_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          id?: string
          image_path: string
          instagram_handle?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          image_path?: string
          instagram_handle?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
        }
        Relationships: [
          {
            foreignKeyName: "photo_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          instagram: string | null
          phone: string | null
          qr_token: string
        }
        Insert: {
          full_name?: string | null
          id: string
          instagram?: string | null
          phone?: string | null
          qr_token?: string
        }
        Update: {
          full_name?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          qr_token?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          code: string
          company_id: string
          created_at: string
          customer_id: string
          id: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          customer_id: string
          id?: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          company_id: string
          cost_points: number
          cost_reais: number | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          company_id: string
          cost_points: number
          cost_reais?: number | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          company_id?: string
          cost_points?: number
          cost_reais?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_reais: number | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          points: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount_reais?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          points: number
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount_reais?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          points?: number
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _apply_points: {
        Args: {
          _company: string
          _customer: string
          _points: number
          _reais: number
          _type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: number
      }
      aprovar_foto: { Args: { _submission_id: string }; Returns: number }
      buscar_cliente_por_telefone: {
        Args: { _company_id: string; _telefone: string }
        Returns: {
          full_name: string
          id: string
          instagram: string
          points_balance: number
        }[]
      }
      entregar_resgate: { Args: { _redemption_id: string }; Returns: undefined }
      enviar_foto: {
        Args: { _company_id: string; _image_path: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_customer: { Args: never; Returns: boolean }
      is_owner_of: { Args: { _company: string }; Returns: boolean }
      is_staff_of: { Args: { _company: string }; Returns: boolean }
      lancar_compra: {
        Args: {
          _company_id: string
          _customer_id: string
          _valor_em_reais: number
        }
        Returns: number
      }
      lancar_pontos: {
        Args: {
          _company: string
          _customer: string
          _points: number
          _type: Database["public"]["Enums"]["transaction_type"]
        }
        Returns: number
      }
      recusar_foto: { Args: { _submission_id: string }; Returns: undefined }
      resgatar_premio: { Args: { _reward_id: string }; Returns: string }
      revisar_print: {
        Args: { _aprovar: boolean; _points?: number; _submission: string }
        Returns: undefined
      }
    }
    Enums: {
      photo_status: "pendente" | "aprovada" | "recusada"
      redemption_status: "pendente" | "entregue" | "cancelado"
      transaction_type:
        | "compra"
        | "foto"
        | "google"
        | "indicacao"
        | "resgate"
        | "ajuste"
      user_role: "cliente" | "funcionario" | "dono" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      photo_status: ["pendente", "aprovada", "recusada"],
      redemption_status: ["pendente", "entregue", "cancelado"],
      transaction_type: [
        "compra",
        "foto",
        "google",
        "indicacao",
        "resgate",
        "ajuste",
      ],
      user_role: ["cliente", "funcionario", "dono", "admin"],
    },
  },
} as const
