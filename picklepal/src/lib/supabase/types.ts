/**
 * Supabase Database type definitions.
 * Matches the schema defined in supabase/migrations/.
 */

export type SessionStatus = "active" | "completed" | "cancelled";
export type MatchStatus = "queued" | "active" | "completed" | "cancelled";
export type MatchType = "singles" | "doubles";
export type MatchSource = "live" | "manual";
export type QueueItemStatus = "pending" | "active" | "completed" | "skipped";
export type SessionPlayerStatus = "active" | "benched" | "removed";

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
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          group_id: string;
          display_name: string;
          avatar_url: string | null;
          color: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          display_name: string;
          avatar_url?: string | null;
          color?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          color?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          group_id: string;
          title: string | null;
          status: SessionStatus;
          default_match_type: string;
          target_score: number;
          win_by: number;
          track_scorers: boolean;
          started_at: string;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title?: string | null;
          status?: SessionStatus;
          default_match_type?: string;
          target_score?: number;
          win_by?: number;
          track_scorers?: boolean;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string | null;
          status?: SessionStatus;
          default_match_type?: string;
          target_score?: number;
          win_by?: number;
          track_scorers?: boolean;
          ended_at?: string | null;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          session_id: string;
          match_type: MatchType;
          status: MatchStatus;
          team_a_player_ids: string[];
          team_b_player_ids: string[];
          team_a_score: number;
          team_b_score: number;
          winning_team: string | null;
          losing_team: string | null;
          starting_server_player_id: string | null;
          target_score: number;
          win_by: number;
          source: MatchSource;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          match_type?: MatchType;
          status?: MatchStatus;
          team_a_player_ids?: string[];
          team_b_player_ids?: string[];
          team_a_score?: number;
          team_b_score?: number;
          winning_team?: string | null;
          losing_team?: string | null;
          starting_server_player_id?: string | null;
          target_score?: number;
          win_by?: number;
          source?: MatchSource;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          match_type?: MatchType;
          status?: MatchStatus;
          team_a_player_ids?: string[];
          team_b_player_ids?: string[];
          team_a_score?: number;
          team_b_score?: number;
          winning_team?: string | null;
          losing_team?: string | null;
          starting_server_player_id?: string | null;
          target_score?: number;
          win_by?: number;
          source?: MatchSource;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      rally_events: {
        Row: {
          id: string;
          match_id: string;
          sequence_number: number;
          rally_winner_team: string;
          resulting_team_a_score: number;
          resulting_team_b_score: number;
          server_player_id: string;
          server_number: number | null;
          side_out_occurred: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sequence_number: number;
          rally_winner_team: string;
          resulting_team_a_score: number;
          resulting_team_b_score: number;
          server_player_id: string;
          server_number?: number | null;
          side_out_occurred?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sequence_number?: number;
          rally_winner_team?: string;
          resulting_team_a_score?: number;
          resulting_team_b_score?: number;
          server_player_id?: string;
          server_number?: number | null;
          side_out_occurred?: boolean;
        };
      };
      match_queue_items: {
        Row: {
          id: string;
          session_id: string;
          match_id: string | null;
          queue_order: number;
          status: QueueItemStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          match_id?: string | null;
          queue_order: number;
          status?: QueueItemStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          match_id?: string | null;
          queue_order?: number;
          status?: QueueItemStatus;
        };
      };
      recap_cards: {
        Row: {
          id: string;
          session_id: string;
          image_url: string | null;
          generated_config: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          image_url?: string | null;
          generated_config?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          image_url?: string | null;
          generated_config?: Record<string, unknown> | null;
        };
      };
      session_players: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          status: SessionPlayerStatus;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          status?: SessionPlayerStatus;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          player_id?: string;
          status?: SessionPlayerStatus;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      session_status: SessionStatus;
      match_status: MatchStatus;
      match_type: MatchType;
      queue_item_status: QueueItemStatus;
      session_player_status: SessionPlayerStatus;
    };
  };
}

// Convenience types
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type RallyEvent = Database["public"]["Tables"]["rally_events"]["Row"];
export type MatchQueueItem =
  Database["public"]["Tables"]["match_queue_items"]["Row"];
export type RecapCard = Database["public"]["Tables"]["recap_cards"]["Row"];
export type SessionPlayer =
  Database["public"]["Tables"]["session_players"]["Row"];
