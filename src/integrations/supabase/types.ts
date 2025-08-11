export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      dokumente: {
        Row: {
          content_base64: string | null
          created_at: string
          dateigröße: number | null
          dateiname: string | null
          dateipfad: string | null
          deleted_at: string | null
          id: string
          immobilie_id: string | null
          kategorie: string
          mieter_id: string | null
          notizen: string | null
          titel: string
          updated_at: string
          version: number
          vertrag_id: string | null
        }
        Insert: {
          content_base64?: string | null
          created_at?: string
          dateigröße?: number | null
          dateiname?: string | null
          dateipfad?: string | null
          deleted_at?: string | null
          id?: string
          immobilie_id?: string | null
          kategorie: string
          mieter_id?: string | null
          notizen?: string | null
          titel: string
          updated_at?: string
          version?: number
          vertrag_id?: string | null
        }
        Update: {
          content_base64?: string | null
          created_at?: string
          dateigröße?: number | null
          dateiname?: string | null
          dateipfad?: string | null
          deleted_at?: string | null
          id?: string
          immobilie_id?: string | null
          kategorie?: string
          mieter_id?: string | null
          notizen?: string | null
          titel?: string
          updated_at?: string
          version?: number
          vertrag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dokumente_immobilie_id_fkey"
            columns: ["immobilie_id"]
            isOneToOne: false
            referencedRelation: "immobilien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dokumente_mieter_id_fkey"
            columns: ["mieter_id"]
            isOneToOne: false
            referencedRelation: "mieter"
            referencedColumns: ["id"]
          },
        ]
      }
      finanzbuchungen: {
        Row: {
          art: string
          beschreibung: string
          betrag: number
          created_at: string
          datum: string
          deleted_at: string | null
          id: string
          immobilie_id: string
          kategorie: string
          mieter_id: string | null
          referenz: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          art: string
          beschreibung: string
          betrag: number
          created_at?: string
          datum: string
          deleted_at?: string | null
          id?: string
          immobilie_id: string
          kategorie: string
          mieter_id?: string | null
          referenz?: string | null
          status: string
          updated_at?: string
          version?: number
        }
        Update: {
          art?: string
          beschreibung?: string
          betrag?: number
          created_at?: string
          datum?: string
          deleted_at?: string | null
          id?: string
          immobilie_id?: string
          kategorie?: string
          mieter_id?: string | null
          referenz?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "finanzbuchungen_immobilie_id_fkey"
            columns: ["immobilie_id"]
            isOneToOne: false
            referencedRelation: "immobilien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finanzbuchungen_mieter_id_fkey"
            columns: ["mieter_id"]
            isOneToOne: false
            referencedRelation: "mieter"
            referencedColumns: ["id"]
          },
        ]
      }
      immobilien: {
        Row: {
          adresse: string
          art: string
          baujahr: number | null
          beschreibung: string | null
          bezeichnung: string
          created_at: string
          deleted_at: string | null
          energieausweis: string | null
          flaeche: number | null
          id: string
          kaltmiete: number | null
          kaution: number | null
          nebenkosten: number | null
          ort: string | null
          plz: string | null
          status: string
          updated_at: string
          version: number
          zimmer: number
        }
        Insert: {
          adresse: string
          art: string
          baujahr?: number | null
          beschreibung?: string | null
          bezeichnung: string
          created_at?: string
          deleted_at?: string | null
          energieausweis?: string | null
          flaeche?: number | null
          id?: string
          kaltmiete?: number | null
          kaution?: number | null
          nebenkosten?: number | null
          ort?: string | null
          plz?: string | null
          status: string
          updated_at?: string
          version?: number
          zimmer: number
        }
        Update: {
          adresse?: string
          art?: string
          baujahr?: number | null
          beschreibung?: string | null
          bezeichnung?: string
          created_at?: string
          deleted_at?: string | null
          energieausweis?: string | null
          flaeche?: number | null
          id?: string
          kaltmiete?: number | null
          kaution?: number | null
          nebenkosten?: number | null
          ort?: string | null
          plz?: string | null
          status?: string
          updated_at?: string
          version?: number
          zimmer?: number
        }
        Relationships: []
      }
      mieter: {
        Row: {
          anrede: string
          auszugsdatum: string | null
          created_at: string
          deleted_at: string | null
          einzugsdatum: string | null
          email: string
          id: string
          immobilie_id: string | null
          nachname: string
          notizen: string | null
          status: string
          telefon: string
          updated_at: string
          version: number
          vorname: string
        }
        Insert: {
          anrede: string
          auszugsdatum?: string | null
          created_at?: string
          deleted_at?: string | null
          einzugsdatum?: string | null
          email: string
          id?: string
          immobilie_id?: string | null
          nachname: string
          notizen?: string | null
          status: string
          telefon: string
          updated_at?: string
          version?: number
          vorname: string
        }
        Update: {
          anrede?: string
          auszugsdatum?: string | null
          created_at?: string
          deleted_at?: string | null
          einzugsdatum?: string | null
          email?: string
          id?: string
          immobilie_id?: string | null
          nachname?: string
          notizen?: string | null
          status?: string
          telefon?: string
          updated_at?: string
          version?: number
          vorname?: string
        }
        Relationships: [
          {
            foreignKeyName: "mieter_immobilie_id_fkey"
            columns: ["immobilie_id"]
            isOneToOne: false
            referencedRelation: "immobilien"
            referencedColumns: ["id"]
          },
        ]
      }
      vertraege: {
        Row: {
          created_at: string
          deleted_at: string | null
          dokument_id: string | null
          id: string
          immobilie_id: string
          kaltmiete: number
          kuendigungsfrist: string
          mietbeginn: string
          mietende: string | null
          mieter_id: string
          mietvertrags_id: string
          nebenkosten: number
          notizen: string | null
          status: string
          updated_at: string
          version: number
          zahlungsintervall: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dokument_id?: string | null
          id?: string
          immobilie_id: string
          kaltmiete: number
          kuendigungsfrist: string
          mietbeginn: string
          mietende?: string | null
          mieter_id: string
          mietvertrags_id: string
          nebenkosten: number
          notizen?: string | null
          status: string
          updated_at?: string
          version?: number
          zahlungsintervall: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dokument_id?: string | null
          id?: string
          immobilie_id?: string
          kaltmiete?: number
          kuendigungsfrist?: string
          mietbeginn?: string
          mietende?: string | null
          mieter_id?: string
          mietvertrags_id?: string
          nebenkosten?: number
          notizen?: string | null
          status?: string
          updated_at?: string
          version?: number
          zahlungsintervall?: string
        }
        Relationships: [
          {
            foreignKeyName: "vertraege_dokument_id_fkey"
            columns: ["dokument_id"]
            isOneToOne: false
            referencedRelation: "dokumente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vertraege_immobilie_id_fkey"
            columns: ["immobilie_id"]
            isOneToOne: false
            referencedRelation: "immobilien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vertraege_mieter_id_fkey"
            columns: ["mieter_id"]
            isOneToOne: false
            referencedRelation: "mieter"
            referencedColumns: ["id"]
          },
        ]
      }
      wartung_maengel: {
        Row: {
          beauftragt_am: string | null
          beschreibung: string | null
          created_at: string
          deleted_at: string | null
          erledigt_am: string | null
          id: string
          immobilie_id: string
          kategorie: string
          kosten_geschaetzt: number | null
          kosten_tatsaechlich: number | null
          mieter_id: string | null
          prioritaet: string
          status: string
          titel: string
          updated_at: string
          version: number
        }
        Insert: {
          beauftragt_am?: string | null
          beschreibung?: string | null
          created_at?: string
          deleted_at?: string | null
          erledigt_am?: string | null
          id?: string
          immobilie_id: string
          kategorie: string
          kosten_geschaetzt?: number | null
          kosten_tatsaechlich?: number | null
          mieter_id?: string | null
          prioritaet: string
          status: string
          titel: string
          updated_at?: string
          version?: number
        }
        Update: {
          beauftragt_am?: string | null
          beschreibung?: string | null
          created_at?: string
          deleted_at?: string | null
          erledigt_am?: string | null
          id?: string
          immobilie_id?: string
          kategorie?: string
          kosten_geschaetzt?: number | null
          kosten_tatsaechlich?: number | null
          mieter_id?: string | null
          prioritaet?: string
          status?: string
          titel?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "wartung_maengel_immobilie_id_fkey"
            columns: ["immobilie_id"]
            isOneToOne: false
            referencedRelation: "immobilien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wartung_maengel_mieter_id_fkey"
            columns: ["mieter_id"]
            isOneToOne: false
            referencedRelation: "mieter"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
