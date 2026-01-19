/**
 * Database Types - taxbook-pro
 * Generated: 2026-01-19
 *
 * This file contains type definitions for the Supabase database.
 * These types are generated based on your entity definitions.
 *
 * To regenerate from your actual database schema, run:
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * Or for a remote database:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 */

// ============================================================
// JSON TYPE
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// DATABASE TYPES
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          firm_name: string | null;
          license_number: string | null;
          timezone: string;
          subscription_tier: string;
          booking_slug: string | null;
          tax_season_start: string | null;
          tax_season_end: string | null;
          max_daily_appointments: number;
          max_daily_appointments_tax_season: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name: string;
          firm_name?: string | null;
          license_number?: string | null;
          timezone: string;
          subscription_tier: string;
          booking_slug?: string | null;
          tax_season_start?: string | null;
          tax_season_end?: string | null;
          max_daily_appointments: number;
          max_daily_appointments_tax_season: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string;
          firm_name?: string | null;
          license_number?: string | null;
          timezone?: string;
          subscription_tier?: string;
          booking_slug?: string | null;
          tax_season_start?: string | null;
          tax_season_end?: string | null;
          max_daily_appointments?: number;
          max_daily_appointments_tax_season?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          tax_id_last4: string | null;
          filing_status: string | null;
          preferred_contact: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          tax_id_last4?: string | null;
          filing_status?: string | null;
          preferred_contact: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          tax_id_last4?: string | null;
          filing_status?: string | null;
          preferred_contact?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number | null;
          tax_season_only: boolean;
          requires_documents: boolean;
          is_active: boolean;
          buffer_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price?: number | null;
          tax_season_only: boolean;
          requires_documents: boolean;
          is_active: boolean;
          buffer_minutes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number | null;
          tax_season_only?: boolean;
          requires_documents?: boolean;
          is_active?: boolean;
          buffer_minutes?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          service_id: string;
          starts_at: string;
          ends_at: string;
          status: string;
          notes: string | null;
          meeting_link: string | null;
          reminder_sent_24h: boolean;
          reminder_sent_1h: boolean;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          service_id: string;
          starts_at: string;
          ends_at: string;
          status: string;
          notes?: string | null;
          meeting_link?: string | null;
          reminder_sent_24h: boolean;
          reminder_sent_1h: boolean;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          service_id?: string;
          starts_at?: string;
          ends_at?: string;
          status?: string;
          notes?: string | null;
          meeting_link?: string | null;
          reminder_sent_24h?: boolean;
          reminder_sent_1h?: boolean;
          cancellation_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      availabilities: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_tax_season: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_tax_season: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_tax_season?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          appointment_id: string | null;
          document_type: string;
          file_url: string | null;
          file_name: string | null;
          status: string;
          tax_year: number | null;
          notes: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          appointment_id?: string | null;
          document_type: string;
          file_url?: string | null;
          file_name?: string | null;
          status: string;
          tax_year?: number | null;
          notes?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          appointment_id?: string | null;
          document_type?: string;
          file_url?: string | null;
          file_name?: string | null;
          status?: string;
          tax_year?: number | null;
          notes?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {
    };
  };
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
