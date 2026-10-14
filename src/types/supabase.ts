// ─── Supabase Type Placeholders ───────────────────────────────────────────────
// Once you run `supabase gen types typescript`, replace this file with the
// auto-generated output. Until then, these stubs keep TypeScript happy.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Auto-generated DB schema will go here after: supabase gen types typescript
// Example structure (do not use until replaced):
export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
          position: string;
          team_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          home_team_id: string;
          away_team_id: string;
          home_score: number;
          away_score: number;
          date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
