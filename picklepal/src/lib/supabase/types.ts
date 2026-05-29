/**
 * Supabase Database type definitions.
 * This file will grow as tables are added in Phase 2.
 * For now, it defines the groups table used in Phase 1c.
 */

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          slug: string;
          name: string;
          host_pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          host_pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          host_pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Convenience type for a group row */
export type Group = Database["public"]["Tables"]["groups"]["Row"];
