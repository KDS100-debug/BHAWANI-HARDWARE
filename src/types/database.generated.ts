// Replace with `npm run db:types` after linking a local or remote Supabase project.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          phone_verified_at: string | null;
          full_name: string | null;
          role: Database["public"]["Enums"]["app_role"];
          is_active: boolean;
          requires_account_completion: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          phone_verified_at?: string | null;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          is_active?: boolean;
          requires_account_completion?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image_path: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          image_path?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          slug: string;
          name: string;
          description: string | null;
          category_id: string | null;
          image_path: string | null;
          selling_price: number;
          default_purchase_cost: number;
          unit: string;
          hsn_sac: string | null;
          gst_rate: number;
          tax_classification: string;
          minimum_stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          slug: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          image_path?: string | null;
          selling_price: number;
          default_purchase_cost?: number;
          unit?: string;
          hsn_sac?: string | null;
          gst_rate?: number;
          tax_classification?: string;
          minimum_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      permissions: {
        Row: {
          code: string;
          module: string;
          label: string;
          description: string;
          is_sensitive: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          module: string;
          label: string;
          description: string;
          is_sensitive?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Insert"]>;
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role: Database["public"]["Enums"]["app_role"];
          permission_code: string;
          granted: boolean;
          created_at: string;
        };
        Insert: {
          role: Database["public"]["Enums"]["app_role"];
          permission_code: string;
          granted?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["role_permissions"]["Insert"]>;
        Relationships: [];
      };
      user_permission_overrides: {
        Row: {
          user_id: string;
          permission_code: string;
          granted: boolean;
          granted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          permission_code: string;
          granted: boolean;
          granted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_permission_overrides"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_permission: {
        Args: { requested_permission: string };
        Returns: boolean;
      };
      my_permissions: {
        Args: Record<PropertyKey, never>;
        Returns: { permission_code: string }[];
      };
      get_product_costs: {
        Args: Record<PropertyKey, never>;
        Returns: { product_id: string; default_purchase_cost: number }[];
      };
      set_user_permissions: {
        Args: { target_user_id: string; requested_permissions: string[] };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "customer" | "owner" | "staff" | "manager" | "sales_staff" | "accountant";
    };
    CompositeTypes: Record<string, never>;
  };
};
