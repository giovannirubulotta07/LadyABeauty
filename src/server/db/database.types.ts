
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "appointments": {
                  Row: {
                    "cancellation_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"client_id": string | null,"client_note": string | null,"created_at": string,"created_by": string | null,"duration_min": number,"id": string,"period": unknown,"price_cents": number | null,"service_id": string | null,"service_name": string,"source": Database["public"]['Enums']["appointment_source"],"status": Database["public"]['Enums']["appointment_status"],"updated_at": string,"variant_id": string | null,"variant_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"client_id"?: string | null,"client_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_min": number,"id"?: string,"period": unknown,"price_cents"?: number | null,"service_id"?: string | null,"service_name": string,"source": Database["public"]['Enums']["appointment_source"],"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string,"variant_id"?: string | null,"variant_name"?: string | null
                  }
                  Update: {
                    "cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"client_id"?: string | null,"client_note"?: string | null,"created_at"?: string,"created_by"?: string | null,"duration_min"?: number,"id"?: string,"period"?: unknown,"price_cents"?: number | null,"service_id"?: string | null,"service_name"?: string,"source"?: Database["public"]['Enums']["appointment_source"],"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string,"variant_id"?: string | null,"variant_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "appointments_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "service_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"period": unknown,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"period": unknown,"reason"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"period"?: unknown,"reason"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"business_settings": {
                  Row: {
                    "address_line1": string,"address_line2": string | null,"cancellation_cutoff_hours": number,"city": string,"country_code": string,"email": string | null,"evening_lock_from": string | null,"home_content": NonNullable<Json>,"id": boolean,"instagram_url": string | null,"latitude": number | null,"legal_name": string | null,"logo_url": string | null,"longitude": number | null,"max_advance_days": number,"min_notice_minutes": number,"name": string,"phone": string | null,"postal_code": string,"reference_starts": (string)[],"reminder_send_time": string,"siret": string | null,"tagline": string,"timezone": string,"updated_at": string,"waitlist_broadcast_before_hours": number,"waitlist_exclusive_minutes": number,"waitlist_quiet_end": string,"waitlist_quiet_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line1": string,"address_line2"?: string | null,"cancellation_cutoff_hours"?: number,"city": string,"country_code"?: string,"email"?: string | null,"evening_lock_from"?: string | null,"home_content"?: NonNullable<Json>,"id"?: boolean,"instagram_url"?: string | null,"latitude"?: number | null,"legal_name"?: string | null,"logo_url"?: string | null,"longitude"?: number | null,"max_advance_days"?: number,"min_notice_minutes"?: number,"name": string,"phone"?: string | null,"postal_code": string,"reference_starts"?: (string)[],"reminder_send_time"?: string,"siret"?: string | null,"tagline"?: string,"timezone"?: string,"updated_at"?: string,"waitlist_broadcast_before_hours"?: number,"waitlist_exclusive_minutes"?: number,"waitlist_quiet_end"?: string,"waitlist_quiet_start"?: string
                  }
                  Update: {
                    "address_line1"?: string,"address_line2"?: string | null,"cancellation_cutoff_hours"?: number,"city"?: string,"country_code"?: string,"email"?: string | null,"evening_lock_from"?: string | null,"home_content"?: NonNullable<Json>,"id"?: boolean,"instagram_url"?: string | null,"latitude"?: number | null,"legal_name"?: string | null,"logo_url"?: string | null,"longitude"?: number | null,"max_advance_days"?: number,"min_notice_minutes"?: number,"name"?: string,"phone"?: string | null,"postal_code"?: string,"reference_starts"?: (string)[],"reminder_send_time"?: string,"siret"?: string | null,"tagline"?: string,"timezone"?: string,"updated_at"?: string,"waitlist_broadcast_before_hours"?: number,"waitlist_exclusive_minutes"?: number,"waitlist_quiet_end"?: string,"waitlist_quiet_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"client_notes": {
                  Row: {
                    "body": string,"client_id": string,"created_at": string,"created_by": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"client_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string
                  }
                  Update: {
                    "body"?: string,"client_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_notes_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string,"id": string,"marketing_email": boolean,"phone": string | null,"privacy_accepted_at": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name": string,"id"?: string,"marketing_email"?: boolean,"phone"?: string | null,"privacy_accepted_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string,"id"?: string,"marketing_email"?: boolean,"phone"?: string | null,"privacy_accepted_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"day_overrides": {
                  Row: {
                    "closed": boolean,"custom_hours": Json | null,"day": string,"evening_unlocked": boolean,"note": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "closed"?: boolean,"custom_hours"?: Json | null,"day": string,"evening_unlocked"?: boolean,"note"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "closed"?: boolean,"custom_hours"?: Json | null,"day"?: string,"evening_unlocked"?: boolean,"note"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"gallery_images": {
                  Row: {
                    "alt": string,"created_at": string,"height": number,"id": string,"image_url": string,"is_published": boolean,"sort_order": number,"storage_path": string | null,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string,"created_at"?: string,"height": number,"id"?: string,"image_url": string,"is_published"?: boolean,"sort_order"?: number,"storage_path"?: string | null,"width": number
                  }
                  Update: {
                    "alt"?: string,"created_at"?: string,"height"?: number,"id"?: string,"image_url"?: string,"is_published"?: boolean,"sort_order"?: number,"storage_path"?: string | null,"width"?: number
                  }
                  Relationships: [
                    
                  ]
                },"notification_log": {
                  Row: {
                    "appointment_id": string | null,"channel": string,"created_at": string,"error": string | null,"id": string,"idempotency_key": string,"kind": string,"offer_id": string | null,"provider_message_id": string | null,"recipient": string,"sent_at": string | null,"status": Database["public"]['Enums']["notification_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "appointment_id"?: string | null,"channel": string,"created_at"?: string,"error"?: string | null,"id"?: string,"idempotency_key": string,"kind": string,"offer_id"?: string | null,"provider_message_id"?: string | null,"recipient": string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["notification_status"]
                  }
                  Update: {
                    "appointment_id"?: string | null,"channel"?: string,"created_at"?: string,"error"?: string | null,"id"?: string,"idempotency_key"?: string,"kind"?: string,"offer_id"?: string | null,"provider_message_id"?: string | null,"recipient"?: string,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["notification_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_log_appointment_id_fkey"
      columns: ["appointment_id"]
isOneToOne: false
      referencedRelation: "appointments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notification_log_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "waitlist_offers"
      referencedColumns: ["id"]
    }
                  ]
                },"opening_hours": {
                  Row: {
                    "closes": string,"id": string,"opens": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "closes": string,"id"?: string,"opens": string,"weekday": number
                  }
                  Update: {
                    "closes"?: string,"id"?: string,"opens"?: string,"weekday"?: number
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_categories": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_variants": {
                  Row: {
                    "created_at": string,"description": string,"duration_min": number | null,"id": string,"is_active": boolean,"name": string,"price_cents": number | null,"service_id": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"duration_min"?: number | null,"id"?: string,"is_active"?: boolean,"name": string,"price_cents"?: number | null,"service_id": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"duration_min"?: number | null,"id"?: string,"is_active"?: boolean,"name"?: string,"price_cents"?: number | null,"service_id"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_variants_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "bookable_online": boolean,"category_id": string,"created_at": string,"deposit_cents": number | null,"description": string,"duration_min": number,"id": string,"is_active": boolean,"is_featured": boolean,"name": string,"price_cents": number | null,"price_is_from": boolean,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bookable_online"?: boolean,"category_id": string,"created_at"?: string,"deposit_cents"?: number | null,"description"?: string,"duration_min": number,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name": string,"price_cents"?: number | null,"price_is_from"?: boolean,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "bookable_online"?: boolean,"category_id"?: string,"created_at"?: string,"deposit_cents"?: number | null,"description"?: string,"duration_min"?: number,"id"?: string,"is_active"?: boolean,"is_featured"?: boolean,"name"?: string,"price_cents"?: number | null,"price_is_from"?: boolean,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "service_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"slot_holds": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"offer_id": string,"period": unknown,"released_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at": string,"id"?: string,"offer_id": string,"period": unknown,"released_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"offer_id"?: string,"period"?: unknown,"released_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "slot_holds_offer_id_fkey"
      columns: ["offer_id"]
isOneToOne: false
      referencedRelation: "waitlist_offers"
      referencedColumns: ["id"]
    }
                  ]
                },"waitlist_entries": {
                  Row: {
                    "client_id": string,"created_at": string,"day": string,"duration_min": number,"id": string,"service_id": string,"status": Database["public"]['Enums']["waitlist_status"],"updated_at": string,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"day": string,"duration_min": number,"id"?: string,"service_id": string,"status"?: Database["public"]['Enums']["waitlist_status"],"updated_at"?: string,"variant_id"?: string | null
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"day"?: string,"duration_min"?: number,"id"?: string,"service_id"?: string,"status"?: Database["public"]['Enums']["waitlist_status"],"updated_at"?: string,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "waitlist_entries_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_entries_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_entries_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "service_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"waitlist_offers": {
                  Row: {
                    "created_at": string,"entry_id": string,"exclusive_until": string | null,"id": string,"period": unknown,"responded_at": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["offer_status"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entry_id": string,"exclusive_until"?: string | null,"id"?: string,"period": unknown,"responded_at"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["offer_status"],"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"entry_id"?: string,"exclusive_until"?: string | null,"id"?: string,"period"?: unknown,"responded_at"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["offer_status"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "waitlist_offers_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "waitlist_entries"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_appointment":
{ Args: { "p_client_id": string,"p_client_note"?: string,"p_created_by"?: string,"p_duration_min": number,"p_hold_offer_id"?: string,"p_price_cents": number,"p_service_id": string,"p_service_name": string,"p_source": Database["public"]['Enums']["appointment_source"],"p_start": string,"p_variant_id": string,"p_variant_name": string }; Returns: string
                           },
"create_block":
{ Args: { "p_created_by"?: string,"p_period": unknown,"p_reason"?: string }; Returns: string
                           },
"hit_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_valid_period":
{ Args: { "p": unknown }; Returns: boolean
                           },
"lock_calendar_day":
{ Args: { "p_day": string }; Returns: undefined
                           },
"lock_calendar_range":
{ Args: { "p_period": unknown }; Returns: undefined
                           }
          }
          Enums: {
            "appointment_source": "online"|"admin"|"waitlist","appointment_status": "confirmed"|"cancelled"|"completed"|"no_show","notification_status": "queued"|"sent"|"failed"|"skipped","offer_status": "offered"|"accepted"|"expired"|"superseded","waitlist_status": "waiting"|"notified"|"booked"|"expired"|"cancelled"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "appointment_source": ["online", "admin", "waitlist"],"appointment_status": ["confirmed", "cancelled", "completed", "no_show"],"notification_status": ["queued", "sent", "failed", "skipped"],"offer_status": ["offered", "accepted", "expired", "superseded"],"waitlist_status": ["waiting", "notified", "booked", "expired", "cancelled"]
          }
        }
} as const
