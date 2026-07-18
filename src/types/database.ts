/**
 * Supabase database types — Foundation Build v1.
 * Extend as migrations add tables.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin" | "staff" | "viewer";

export type ClientStatus = "active" | "watch" | "critical" | "archived";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type RiskStatus = "open" | "in_progress" | "resolved" | "archived";

export type ClientRiskSeverity = "low" | "medium" | "high" | "critical";

export type ClientRiskStatus =
  | "open"
  | "acknowledged"
  | "mitigated"
  | "resolved"
  | "dismissed";

export type ClientRiskSource =
  | "manual"
  | "health_engine"
  | "sla"
  | "report"
  | "activity"
  | "portal"
  | "monitoring";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "investigating" | "resolved" | "archived";

export type IncidentActivityEventType =
  | "incident.created"
  | "incident.assigned"
  | "incident.status_changed"
  | "incident.resolved"
  | "incident.closed";

export type RiskActivityEventType =
  | "risk.created"
  | "risk.updated"
  | "risk.assigned"
  | "risk.score_changed"
  | "risk.status_changed"
  | "risk.accepted"
  | "risk.resolved"
  | "risk.dismissed"
  | "risk.deleted"
  | "risk.acknowledged"
  | "risk.mitigated"
  | "risk.detected";

export type ReportStatus = "draft" | "generated" | "published" | "archived";

export type NotificationType =
  | "report_generated"
  | "report_published"
  | "report_sent"
  | "critical_risk"
  | "critical_incident"
  | "portal_user_created"
  | "report_email_failed"
  | "sla_warning"
  | "sla_breached"
  | "escalation_warning"
  | "escalation_triggered"
  | "subscription_activated"
  | "subscription_payment_failed"
  | "subscription_cancelled"
  | "subscription_trial_ending"
  | "seat_limit_reached"
  | "plan_limit_reached"
  | "billing_limit_approaching"
  | "billing_limit_reached"
  | "invoice_paid"
  | "invoice_failed";

export type ReportScheduleFrequency = "monthly" | "quarterly";

export type ReportEmailDeliveryStatus = "pending" | "sent" | "failed";

export type InviteRole = "admin" | "staff" | "viewer";

export type HealthSnapshotStatus = "excellent" | "healthy" | "watch" | "critical";

export type ActivityEntityType =
  | "client"
  | "risk"
  | "incident"
  | "report"
  | "financial"
  | "team"
  | "organization"
  | "sales_lead";

export type SalesPipelineStage =
  | "pilot_lead"
  | "pilot_application"
  | "discovery_call"
  | "qualified"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export type SalesLeadSource =
  | "contact"
  | "pilot"
  | "demo"
  | "newsletter"
  | "referral"
  | "signup"
  | "other";

export type SalesInboxKey = "support" | "sales" | "info" | "security";

export type OutboundListType =
  | "prospects"
  | "companies"
  | "agencies"
  | "msps"
  | "consultants"
  | "ai_agencies";

export type ProspectSegment = OutboundListType;

export type LeadSourceRegion = "germany" | "dach" | "eu";

export type AgencyType = "msp" | "ai_agency" | "automation_agency" | "agency" | "consultant";

export type SalesProposalStatus = "draft" | "sent" | "accepted" | "declined";

export type AutomationWorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "disabled"
  | "archived";

export type AutomationExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "partial"
  | "cancelled"
  | "simulation"
  | "skipped";

export type AutomationExecutionStepStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type IntegrationSecretType =
  | "bearer_token"
  | "api_key"
  | "basic_auth"
  | "webhook_secret"
  | "smtp_credentials"
  | "oauth_placeholder"
  | "oauth_access_token"
  | "oauth_refresh_token";

export type IntegrationSecretStatus =
  | "active"
  | "inactive"
  | "expired"
  | "pending_rotation";

export type IntegrationDeliveryStatus =
  | "queued"
  | "sending"
  | "delivered"
  | "failed"
  | "rate_limited"
  | "retrying"
  | "dead_letter";

export type IntegrationConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "revoked"
  | "expired";

export type IntegrationSyncType = "manual" | "scheduled" | "incremental" | "full";

export type IntegrationSyncJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ApiKeyType = "personal" | "workspace";

export type ApiKeyStatus = "active" | "revoked" | "expired";

export type ApiWebhookEndpointStatus = "active" | "inactive" | "disabled";

export type ApiWebhookDeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "retrying"
  | "dead_letter";

export type WhiteLabelDomainVerificationStatus =
  | "not_configured"
  | "pending"
  | "verified"
  | "failed";

export type WhiteLabelDomainSslStatus =
  | "not_configured"
  | "pending"
  | "active"
  | "failed";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          organization_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          is_disabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          organization_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          is_disabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          organization_id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          is_disabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          status: ClientStatus;
          owner_id: string | null;
          health_score: number | null;
          contact_name: string | null;
          contact_email: string | null;
          monthly_revenue: number | null;
          notes: string | null;
          sla_policy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          status?: ClientStatus;
          owner_id?: string | null;
          health_score?: number | null;
          contact_name?: string | null;
          contact_email?: string | null;
          monthly_revenue?: number | null;
          notes?: string | null;
          sla_policy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          status?: ClientStatus;
          owner_id?: string | null;
          health_score?: number | null;
          contact_name?: string | null;
          contact_email?: string | null;
          monthly_revenue?: number | null;
          notes?: string | null;
          sla_policy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_sla_policy_id_fkey";
            columns: ["sla_policy_id"];
            isOneToOne: false;
            referencedRelation: "sla_policies";
            referencedColumns: ["id"];
          },
        ];
      };
      client_portal_users: {
        Row: {
          id: string;
          auth_user_id: string;
          organization_id: string;
          client_id: string;
          email: string;
          full_name: string;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          organization_id: string;
          client_id: string;
          email: string;
          full_name: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          organization_id?: string;
          client_id?: string;
          email?: string;
          full_name?: string;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_portal_users_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_portal_users_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      risks: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          title: string;
          description: string | null;
          severity: RiskSeverity;
          status: RiskStatus;
          owner_user_id: string;
          due_date: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          title: string;
          description?: string | null;
          severity?: RiskSeverity;
          status?: RiskStatus;
          owner_user_id: string;
          due_date?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          severity?: RiskSeverity;
          status?: RiskStatus;
          owner_user_id?: string;
          due_date?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "risks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risks_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risks_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      client_risks: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          title: string;
          description: string | null;
          severity: ClientRiskSeverity;
          status: ClientRiskStatus;
          source: ClientRiskSource;
          category: string | null;
          impact: string | null;
          recommendation: string | null;
          owner_user_id: string | null;
          due_at: string | null;
          detected_at: string;
          resolved_at: string | null;
          accepted_at: string | null;
          mitigation_plan: string | null;
          likelihood: number;
          impact_score: number;
          risk_score: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          title: string;
          description?: string | null;
          severity?: ClientRiskSeverity;
          status?: ClientRiskStatus;
          source?: ClientRiskSource;
          category?: string | null;
          impact?: string | null;
          recommendation?: string | null;
          owner_user_id?: string | null;
          due_at?: string | null;
          detected_at?: string;
          resolved_at?: string | null;
          accepted_at?: string | null;
          mitigation_plan?: string | null;
          likelihood?: number;
          impact_score?: number;
          risk_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          severity?: ClientRiskSeverity;
          status?: ClientRiskStatus;
          source?: ClientRiskSource;
          category?: string | null;
          impact?: string | null;
          recommendation?: string | null;
          owner_user_id?: string | null;
          due_at?: string | null;
          detected_at?: string;
          resolved_at?: string | null;
          accepted_at?: string | null;
          mitigation_plan?: string | null;
          likelihood?: number;
          impact_score?: number;
          risk_score?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_risks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_risks_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_risks_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      incidents: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          risk_id: string | null;
          client_risk_id: string | null;
          title: string;
          description: string | null;
          severity: IncidentSeverity;
          status: IncidentStatus;
          assigned_user_id: string;
          occurred_at: string;
          due_at: string | null;
          resolution_notes: string | null;
          resolved_at: string | null;
          portal_visible: boolean;
          client_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          risk_id?: string | null;
          client_risk_id?: string | null;
          title: string;
          description?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          assigned_user_id: string;
          occurred_at?: string;
          due_at?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          portal_visible?: boolean;
          client_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          risk_id?: string | null;
          client_risk_id?: string | null;
          title?: string;
          description?: string | null;
          severity?: IncidentSeverity;
          status?: IncidentStatus;
          assigned_user_id?: string;
          occurred_at?: string;
          due_at?: string | null;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          portal_visible?: boolean;
          client_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_risk_id_fkey";
            columns: ["risk_id"];
            isOneToOne: false;
            referencedRelation: "risks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incidents_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      incident_activity: {
        Row: {
          id: string;
          organization_id: string;
          incident_id: string;
          actor_user_id: string | null;
          event_type: IncidentActivityEventType;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          incident_id: string;
          actor_user_id?: string | null;
          event_type: IncidentActivityEventType;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          incident_id?: string;
          actor_user_id?: string | null;
          event_type?: IncidentActivityEventType;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incident_activity_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_activity_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_activity_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      risk_activity: {
        Row: {
          id: string;
          organization_id: string;
          risk_id: string;
          actor_user_id: string | null;
          event_type: RiskActivityEventType;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          risk_id: string;
          actor_user_id?: string | null;
          event_type: RiskActivityEventType;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          risk_id?: string;
          actor_user_id?: string | null;
          event_type?: RiskActivityEventType;
          message?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "risk_activity_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_activity_risk_id_fkey";
            columns: ["risk_id"];
            isOneToOne: false;
            referencedRelation: "client_risks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "risk_activity_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          title: string;
          reporting_period_start: string;
          reporting_period_end: string;
          status: ReportStatus;
          executive_summary: string | null;
          key_wins: string | null;
          key_risks: string | null;
          next_actions: string | null;
          assigned_user_id: string;
          sent_at: string | null;
          published_at: string | null;
          version: number;
          root_report_id: string | null;
          summary: string | null;
          portal_summary: string | null;
          health_score: number | null;
          sla_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          title: string;
          reporting_period_start: string;
          reporting_period_end: string;
          status?: ReportStatus;
          executive_summary?: string | null;
          summary?: string | null;
          portal_summary?: string | null;
          key_wins?: string | null;
          key_risks?: string | null;
          next_actions?: string | null;
          assigned_user_id: string;
          sent_at?: string | null;
          published_at?: string | null;
          version?: number;
          root_report_id?: string | null;
          health_score?: number | null;
          sla_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          title?: string;
          reporting_period_start?: string;
          reporting_period_end?: string;
          status?: ReportStatus;
          executive_summary?: string | null;
          summary?: string | null;
          portal_summary?: string | null;
          key_wins?: string | null;
          key_risks?: string | null;
          next_actions?: string | null;
          assigned_user_id?: string;
          sent_at?: string | null;
          published_at?: string | null;
          version?: number;
          root_report_id?: string | null;
          health_score?: number | null;
          sla_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      report_email_deliveries: {
        Row: {
          id: string;
          organization_id: string;
          report_id: string;
          recipient_email: string;
          subject: string;
          message: string;
          sent_at: string | null;
          status: ReportEmailDeliveryStatus;
          error_message: string | null;
          resend_message_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          report_id: string;
          recipient_email: string;
          subject: string;
          message: string;
          sent_at?: string | null;
          status?: ReportEmailDeliveryStatus;
          error_message?: string | null;
          resend_message_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          report_id?: string;
          recipient_email?: string;
          subject?: string;
          message?: string;
          sent_at?: string | null;
          status?: ReportEmailDeliveryStatus;
          error_message?: string | null;
          resend_message_id?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_email_deliveries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_email_deliveries_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_email_deliveries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_email_settings: {
        Row: {
          id: string;
          organization_id: string;
          from_name: string;
          from_email: string;
          reply_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          from_name: string;
          from_email: string;
          reply_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          from_name?: string;
          from_email?: string;
          reply_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_email_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_branding: {
        Row: {
          id: string;
          organization_id: string;
          company_name: string;
          primary_color: string;
          secondary_color: string;
          logo_url: string | null;
          portal_welcome_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          company_name: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string | null;
          portal_welcome_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          company_name?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string | null;
          portal_welcome_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          billing_provider: "stripe" | "paddle";
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          provider_price_id: string | null;
          provider_status: string | null;
          sync_pending: boolean;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_provider?: "stripe" | "paddle";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          provider_price_id?: string | null;
          provider_status?: string | null;
          sync_pending?: boolean;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_provider?: "stripe" | "paddle";
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          provider_price_id?: string | null;
          provider_status?: string | null;
          sync_pending?: boolean;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      report_schedules: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          title_template: string;
          frequency: ReportScheduleFrequency;
          day_of_month: number | null;
          assigned_user_id: string | null;
          template_id: string | null;
          is_active: boolean;
          next_run_at: string | null;
          last_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          title_template: string;
          frequency: ReportScheduleFrequency;
          day_of_month?: number | null;
          assigned_user_id?: string | null;
          template_id?: string | null;
          is_active?: boolean;
          next_run_at?: string | null;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          title_template?: string;
          frequency?: ReportScheduleFrequency;
          day_of_month?: number | null;
          assigned_user_id?: string | null;
          template_id?: string | null;
          is_active?: boolean;
          next_run_at?: string | null;
          last_run_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_schedules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_schedules_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_schedules_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_schedules_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "report_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      report_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          executive_summary_template: string | null;
          key_wins_template: string | null;
          key_risks_template: string | null;
          next_actions_template: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          executive_summary_template?: string | null;
          key_wins_template?: string | null;
          key_risks_template?: string | null;
          next_actions_template?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          executive_summary_template?: string | null;
          key_wins_template?: string | null;
          key_risks_template?: string | null;
          next_actions_template?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_templates_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      escalation_executions: {
        Row: {
          id: string;
          organization_id: string;
          escalation_rule_id: string;
          trigger_type: string;
          entity_type: string;
          entity_id: string;
          executed_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          escalation_rule_id: string;
          trigger_type: string;
          entity_type: string;
          entity_id: string;
          executed_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          escalation_rule_id?: string;
          trigger_type?: string;
          entity_type?: string;
          entity_id?: string;
          executed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "escalation_executions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalation_executions_escalation_rule_id_fkey";
            columns: ["escalation_rule_id"];
            isOneToOne: false;
            referencedRelation: "escalation_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      escalation_rules: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trigger_type: string;
          severity: string | null;
          delay_minutes: number;
          notify_owner: boolean;
          notify_assigned_user: boolean;
          create_activity: boolean;
          create_notification: boolean;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          trigger_type: string;
          severity?: string | null;
          delay_minutes?: number;
          notify_owner?: boolean;
          notify_assigned_user?: boolean;
          create_activity?: boolean;
          create_notification?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          trigger_type?: string;
          severity?: string | null;
          delay_minutes?: number;
          notify_owner?: boolean;
          notify_assigned_user?: boolean;
          create_activity?: boolean;
          create_notification?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "escalation_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sla_policies: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          incident_hours: number | null;
          risk_hours: number | null;
          is_default: boolean;
          critical_response_minutes: number;
          critical_resolution_minutes: number;
          high_response_minutes: number;
          high_resolution_minutes: number;
          medium_response_minutes: number;
          medium_resolution_minutes: number;
          low_response_minutes: number;
          low_resolution_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          incident_hours?: number | null;
          risk_hours?: number | null;
          is_default?: boolean;
          critical_response_minutes?: number;
          critical_resolution_minutes?: number;
          high_response_minutes?: number;
          high_resolution_minutes?: number;
          medium_response_minutes?: number;
          medium_resolution_minutes?: number;
          low_response_minutes?: number;
          low_resolution_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          incident_hours?: number | null;
          risk_hours?: number | null;
          is_default?: boolean;
          critical_response_minutes?: number;
          critical_resolution_minutes?: number;
          high_response_minutes?: number;
          high_resolution_minutes?: number;
          medium_response_minutes?: number;
          medium_resolution_minutes?: number;
          low_response_minutes?: number;
          low_resolution_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sla_policies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sla_events: {
        Row: {
          id: string;
          organization_id: string;
          incident_id: string | null;
          client_id: string | null;
          policy_id: string | null;
          status: string;
          breached: boolean;
          started_at: string | null;
          response_due_at: string | null;
          resolution_due_at: string | null;
          responded_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          incident_id?: string | null;
          client_id?: string | null;
          policy_id?: string | null;
          status?: string;
          breached?: boolean;
          started_at?: string | null;
          response_due_at?: string | null;
          resolution_due_at?: string | null;
          responded_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          incident_id?: string | null;
          client_id?: string | null;
          policy_id?: string | null;
          status?: string;
          breached?: boolean;
          started_at?: string | null;
          response_due_at?: string | null;
          resolution_due_at?: string | null;
          responded_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sla_activity: {
        Row: {
          id: string;
          organization_id: string;
          event_type: string;
          actor_user_id: string | null;
          incident_id: string | null;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: string;
          actor_user_id?: string | null;
          incident_id?: string | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: string;
          actor_user_id?: string | null;
          incident_id?: string | null;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      monitoring_connectors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          provider: string;
          status: string;
          enabled: boolean;
          configuration: Json;
          last_check_at: string | null;
          last_success_at: string | null;
          last_failure_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          provider: string;
          status?: string;
          enabled?: boolean;
          configuration?: Json;
          last_check_at?: string | null;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          provider?: string;
          status?: string;
          enabled?: boolean;
          configuration?: Json;
          last_check_at?: string | null;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monitoring_events: {
        Row: {
          id: string;
          organization_id: string;
          connector_id: string | null;
          client_id: string | null;
          severity: string;
          status: string;
          message: string | null;
          payload: Json | null;
          detected_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connector_id?: string | null;
          client_id?: string | null;
          severity: string;
          status: string;
          message?: string | null;
          payload?: Json | null;
          detected_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connector_id?: string | null;
          client_id?: string | null;
          severity?: string;
          status?: string;
          message?: string | null;
          payload?: Json | null;
          detected_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      monitoring_activity: {
        Row: {
          id: string;
          organization_id: string;
          connector_id: string | null;
          event_type: string;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connector_id?: string | null;
          event_type: string;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connector_id?: string | null;
          event_type?: string;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      incident_ai_analysis: {
        Row: {
          id: string;
          organization_id: string;
          incident_id: string | null;
          provider: string;
          model: string;
          summary: string | null;
          root_cause: string | null;
          recommendations: string | null;
          confidence: number | null;
          tokens_used: number | null;
          latency_ms: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          incident_id?: string | null;
          provider: string;
          model: string;
          summary?: string | null;
          root_cause?: string | null;
          recommendations?: string | null;
          confidence?: number | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          incident_id?: string | null;
          provider?: string;
          model?: string;
          summary?: string | null;
          root_cause?: string | null;
          recommendations?: string | null;
          confidence?: number | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      risk_ai_analysis: {
        Row: {
          id: string;
          organization_id: string;
          risk_id: string;
          provider: string;
          model: string;
          summary: string | null;
          risk_reasoning: string | null;
          mitigation_plan: string | null;
          recommended_actions: Json;
          predicted_severity: string | null;
          predicted_score: number | null;
          confidence: number | null;
          tokens_used: number | null;
          latency_ms: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          risk_id: string;
          provider: string;
          model: string;
          summary?: string | null;
          risk_reasoning?: string | null;
          mitigation_plan?: string | null;
          recommended_actions?: Json;
          predicted_severity?: string | null;
          predicted_score?: number | null;
          confidence?: number | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          risk_id?: string;
          provider?: string;
          model?: string;
          summary?: string | null;
          risk_reasoning?: string | null;
          mitigation_plan?: string | null;
          recommended_actions?: Json;
          predicted_severity?: string | null;
          predicted_score?: number | null;
          confidence?: number | null;
          tokens_used?: number | null;
          latency_ms?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      executive_report_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          report_id: string | null;
          executive_summary: string | null;
          risk_summary: string | null;
          incident_summary: string | null;
          sla_summary: string | null;
          monitoring_summary: string | null;
          ai_summary: string | null;
          generated_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          organization_id: string;
          report_id?: string | null;
          executive_summary?: string | null;
          risk_summary?: string | null;
          incident_summary?: string | null;
          sla_summary?: string | null;
          monitoring_summary?: string | null;
          ai_summary?: string | null;
          generated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          organization_id?: string;
          report_id?: string | null;
          executive_summary?: string | null;
          risk_summary?: string | null;
          incident_summary?: string | null;
          sla_summary?: string | null;
          monitoring_summary?: string | null;
          ai_summary?: string | null;
          generated_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      client_financials: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          monthly_revenue: number;
          monthly_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          monthly_revenue?: number;
          monthly_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          monthly_revenue?: number;
          monthly_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_financials_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_financials_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      health_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          score: number;
          status: HealthSnapshotStatus;
          delta: number;
          reason: string | null;
          breakdown: Json;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          score: number;
          status: HealthSnapshotStatus;
          delta?: number;
          reason?: string | null;
          breakdown?: Json;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          score?: number;
          status?: HealthSnapshotStatus;
          delta?: number;
          reason?: string | null;
          breakdown?: Json;
          calculated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "health_snapshots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "health_snapshots_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      team_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: InviteRole;
          token: string;
          invited_by_user_id: string;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role: InviteRole;
          token: string;
          invited_by_user_id: string;
          accepted_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: InviteRole;
          token?: string;
          invited_by_user_id?: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_invited_by_user_id_fkey";
            columns: ["invited_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_user_id: string | null;
          entity_type: ActivityEntityType;
          entity_id: string | null;
          event_type: string;
          action: string;
          title: string;
          description: string | null;
          metadata: Json;
          portal_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_user_id?: string | null;
          entity_type: ActivityEntityType;
          entity_id?: string | null;
          event_type?: string;
          action: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          portal_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_user_id?: string | null;
          entity_type?: ActivityEntityType;
          entity_id?: string | null;
          event_type?: string;
          action?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          portal_visible?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_request_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          client_id: string | null;
          report_id: string | null;
          provider: string;
          model: string;
          feature: string;
          status: string;
          prompt_version: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          total_tokens: number | null;
          latency_ms: number | null;
          provider_request_id: string | null;
          error_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          client_id?: string | null;
          report_id?: string | null;
          provider?: string;
          model: string;
          feature: string;
          status: string;
          prompt_version?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          latency_ms?: number | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          client_id?: string | null;
          report_id?: string | null;
          provider?: string;
          model?: string;
          feature?: string;
          status?: string;
          prompt_version?: string | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          latency_ms?: number | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_request_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_request_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_request_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_request_logs_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_openai_health_checks: {
        Row: {
          id: string;
          ok: boolean;
          model: string | null;
          latency_ms: number | null;
          provider_request_id: string | null;
          error_code: string | null;
          sanitized_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ok: boolean;
          model?: string | null;
          latency_ms?: number | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          sanitized_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ok?: boolean;
          model?: string | null;
          latency_ms?: number | null;
          provider_request_id?: string | null;
          error_code?: string | null;
          sanitized_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage_events: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          feature: string;
          provider: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          total_tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          feature?: string;
          provider: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          feature?: string;
          provider?: string;
          model?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          total_tokens?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string | null;
          entity_type: string | null;
          entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_workflows: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          status: AutomationWorkflowStatus;
          version: number;
          workflow_json: Json;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          status?: AutomationWorkflowStatus;
          version?: number;
          workflow_json: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          status?: AutomationWorkflowStatus;
          version?: number;
          workflow_json?: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_workflows_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_workflow_versions: {
        Row: {
          id: string;
          workflow_id: string;
          version: number;
          workflow_json: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          version: number;
          workflow_json: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          version?: number;
          workflow_json?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_workflow_versions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_executions: {
        Row: {
          id: string;
          workflow_id: string;
          organization_id: string;
          trigger: string;
          status: AutomationExecutionStatus;
          started_at: string;
          finished_at: string | null;
          duration_ms: number | null;
          execution_log: Json;
          simulated: boolean;
          initiated_by: string;
          entity_type: string | null;
          entity_id: string | null;
          event_id: string | null;
          trigger_hash: string | null;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          organization_id: string;
          trigger: string;
          status: AutomationExecutionStatus;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
          execution_log?: Json;
          simulated?: boolean;
          initiated_by?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          event_id?: string | null;
          trigger_hash?: string | null;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          organization_id?: string;
          trigger?: string;
          status?: AutomationExecutionStatus;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
          execution_log?: Json;
          simulated?: boolean;
          initiated_by?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          event_id?: string | null;
          trigger_hash?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_executions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_executions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_execution_steps: {
        Row: {
          id: string;
          execution_id: string;
          order_index: number;
          action: string;
          result: Json;
          duration_ms: number | null;
          status: AutomationExecutionStepStatus;
        };
        Insert: {
          id?: string;
          execution_id: string;
          order_index: number;
          action: string;
          result?: Json;
          duration_ms?: number | null;
          status?: AutomationExecutionStepStatus;
        };
        Update: {
          id?: string;
          execution_id?: string;
          order_index?: number;
          action?: string;
          result?: Json;
          duration_ms?: number | null;
          status?: AutomationExecutionStepStatus;
        };
        Relationships: [
          {
            foreignKeyName: "automation_execution_steps_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "automation_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_webhooks: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          secret: string;
          endpoint: string;
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          secret: string;
          endpoint: string;
          enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          secret?: string;
          endpoint?: string;
          enabled?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_webhooks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_org_state: {
        Row: {
          organization_id: string;
          local_storage_migrated_at: string | null;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          local_storage_migrated_at?: string | null;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          local_storage_migrated_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_org_state_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_secrets: {
        Row: {
          id: string;
          organization_id: string;
          provider_id: string;
          name: string;
          description: string | null;
          secret_type: IntegrationSecretType;
          encrypted_value: string;
          status: IntegrationSecretStatus;
          created_by: string | null;
          updated_by: string | null;
          last_used_at: string | null;
          rotation_due_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider_id: string;
          name: string;
          description?: string | null;
          secret_type: IntegrationSecretType;
          encrypted_value: string;
          status?: IntegrationSecretStatus;
          created_by?: string | null;
          updated_by?: string | null;
          last_used_at?: string | null;
          rotation_due_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          provider_id?: string;
          name?: string;
          description?: string | null;
          secret_type?: IntegrationSecretType;
          encrypted_value?: string;
          status?: IntegrationSecretStatus;
          created_by?: string | null;
          updated_by?: string | null;
          last_used_at?: string | null;
          rotation_due_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_secrets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_delivery_logs: {
        Row: {
          id: string;
          organization_id: string;
          workflow_id: string | null;
          workflow_execution_id: string | null;
          action_id: string | null;
          provider_id: string;
          status: IntegrationDeliveryStatus;
          retry_count: number;
          max_retries: number;
          last_retry_at: string | null;
          next_retry_at: string | null;
          failure_reason: string | null;
          response_code: number | null;
          latency_ms: number | null;
          delivery_id: string | null;
          provider_message_id: string | null;
          request_method: string | null;
          request_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          workflow_id?: string | null;
          workflow_execution_id?: string | null;
          action_id?: string | null;
          provider_id: string;
          status: IntegrationDeliveryStatus;
          retry_count?: number;
          max_retries?: number;
          last_retry_at?: string | null;
          next_retry_at?: string | null;
          failure_reason?: string | null;
          response_code?: number | null;
          latency_ms?: number | null;
          delivery_id?: string | null;
          provider_message_id?: string | null;
          request_method?: string | null;
          request_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          workflow_id?: string | null;
          workflow_execution_id?: string | null;
          action_id?: string | null;
          provider_id?: string;
          status?: IntegrationDeliveryStatus;
          retry_count?: number;
          max_retries?: number;
          last_retry_at?: string | null;
          next_retry_at?: string | null;
          failure_reason?: string | null;
          response_code?: number | null;
          latency_ms?: number | null;
          delivery_id?: string | null;
          provider_message_id?: string | null;
          request_method?: string | null;
          request_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_delivery_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_connections: {
        Row: {
          id: string;
          organization_id: string;
          connector_id: string;
          connector_version: string;
          display_name: string;
          status: IntegrationConnectionStatus;
          access_secret_id: string | null;
          refresh_secret_id: string | null;
          scopes: string[];
          token_expires_at: string | null;
          last_sync_at: string | null;
          last_sync_status: string | null;
          health_status: string;
          metadata: Json;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connector_id: string;
          connector_version?: string;
          display_name: string;
          status?: IntegrationConnectionStatus;
          access_secret_id?: string | null;
          refresh_secret_id?: string | null;
          scopes?: string[];
          token_expires_at?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          health_status?: string;
          metadata?: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connector_id?: string;
          connector_version?: string;
          display_name?: string;
          status?: IntegrationConnectionStatus;
          access_secret_id?: string | null;
          refresh_secret_id?: string | null;
          scopes?: string[];
          token_expires_at?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          health_status?: string;
          metadata?: Json;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_oauth_states: {
        Row: {
          id: string;
          organization_id: string;
          connector_id: string;
          state_token: string;
          code_verifier: string | null;
          redirect_uri: string;
          scopes: string[];
          expires_at: string;
          consumed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connector_id: string;
          state_token: string;
          code_verifier?: string | null;
          redirect_uri: string;
          scopes?: string[];
          expires_at: string;
          consumed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connector_id?: string;
          state_token?: string;
          code_verifier?: string | null;
          redirect_uri?: string;
          scopes?: string[];
          expires_at?: string;
          consumed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_oauth_states_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_sync_jobs: {
        Row: {
          id: string;
          organization_id: string;
          connection_id: string;
          connector_id: string;
          sync_type: IntegrationSyncType;
          status: IntegrationSyncJobStatus;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number | null;
          records_changed: number;
          cursor: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          connection_id: string;
          connector_id: string;
          sync_type: IntegrationSyncType;
          status?: IntegrationSyncJobStatus;
          started_at?: string | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          records_changed?: number;
          cursor?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          connection_id?: string;
          connector_id?: string;
          sync_type?: IntegrationSyncType;
          status?: IntegrationSyncJobStatus;
          started_at?: string | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          records_changed?: number;
          cursor?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integration_sync_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          key_type: ApiKeyType;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes: string[];
          status: ApiKeyStatus;
          expires_at: string | null;
          last_used_at: string | null;
          created_by: string | null;
          revoked_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          key_type: ApiKeyType;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes?: string[];
          status?: ApiKeyStatus;
          expires_at?: string | null;
          last_used_at?: string | null;
          created_by?: string | null;
          revoked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          key_type?: ApiKeyType;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          scopes?: string[];
          status?: ApiKeyStatus;
          expires_at?: string | null;
          last_used_at?: string | null;
          created_by?: string | null;
          revoked_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      api_request_logs: {
        Row: {
          id: string;
          organization_id: string;
          api_key_id: string | null;
          method: string;
          path: string;
          status_code: number;
          duration_ms: number;
          rate_limited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          api_key_id?: string | null;
          method: string;
          path: string;
          status_code: number;
          duration_ms?: number;
          rate_limited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          api_key_id?: string | null;
          method?: string;
          path?: string;
          status_code?: number;
          duration_ms?: number;
          rate_limited?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_request_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      api_webhook_endpoints: {
        Row: {
          id: string;
          organization_id: string;
          url: string;
          description: string | null;
          events: string[];
          signing_secret_encrypted: string;
          status: ApiWebhookEndpointStatus;
          created_by: string | null;
          updated_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          url: string;
          description?: string | null;
          events?: string[];
          signing_secret_encrypted: string;
          status?: ApiWebhookEndpointStatus;
          created_by?: string | null;
          updated_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          url?: string;
          description?: string | null;
          events?: string[];
          signing_secret_encrypted?: string;
          status?: ApiWebhookEndpointStatus;
          created_by?: string | null;
          updated_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_webhook_endpoints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      api_webhook_deliveries: {
        Row: {
          id: string;
          organization_id: string;
          endpoint_id: string;
          event_type: string;
          payload: Json;
          status: ApiWebhookDeliveryStatus;
          attempts: number;
          response_status: number | null;
          error_message: string | null;
          next_retry_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          endpoint_id: string;
          event_type: string;
          payload?: Json;
          status?: ApiWebhookDeliveryStatus;
          attempts?: number;
          response_status?: number | null;
          error_message?: string | null;
          next_retry_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          endpoint_id?: string;
          event_type?: string;
          payload?: Json;
          status?: ApiWebhookDeliveryStatus;
          attempts?: number;
          response_status?: number | null;
          error_message?: string | null;
          next_retry_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_webhook_deliveries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_endpoints: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          url: string;
          secret: string;
          events: string[];
          active: boolean;
          last_success_at: string | null;
          last_failure_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          url: string;
          secret: string;
          events?: string[];
          active?: boolean;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          url?: string;
          secret?: string;
          events?: string[];
          active?: boolean;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          id: string;
          organization_id: string;
          endpoint_id: string;
          event_type: string;
          payload: Json;
          status: string;
          response_status: number | null;
          response_body: string | null;
          attempts: number;
          next_retry_at: string | null;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          endpoint_id: string;
          event_type: string;
          payload?: Json;
          status?: string;
          response_status?: number | null;
          response_body?: string | null;
          attempts?: number;
          next_retry_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          endpoint_id?: string;
          event_type?: string;
          payload?: Json;
          status?: string;
          response_status?: number | null;
          response_body?: string | null;
          attempts?: number;
          next_retry_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey";
            columns: ["endpoint_id"];
            isOneToOne: false;
            referencedRelation: "webhook_endpoints";
            referencedColumns: ["id"];
          },
        ];
      };
      enterprise_requests: {
        Row: {
          id: string;
          organization_id: string;
          requested_by: string | null;
          contact_email: string | null;
          company_name: string | null;
          requested_seats: number | null;
          requested_clients: number | null;
          requested_features: string[];
          notes: string | null;
          status: string;
          handled_by: string | null;
          handled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          requested_by?: string | null;
          contact_email?: string | null;
          company_name?: string | null;
          requested_seats?: number | null;
          requested_clients?: number | null;
          requested_features?: string[];
          notes?: string | null;
          status?: string;
          handled_by?: string | null;
          handled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          requested_by?: string | null;
          contact_email?: string | null;
          company_name?: string | null;
          requested_seats?: number | null;
          requested_clients?: number | null;
          requested_features?: string[];
          notes?: string | null;
          status?: string;
          handled_by?: string | null;
          handled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enterprise_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_plan_overrides: {
        Row: {
          id: string;
          organization_id: string;
          plan: string;
          status: string;
          seats_limit: number | null;
          clients_limit: number | null;
          monitoring_limit: number | null;
          api_enabled: boolean;
          webhooks_enabled: boolean;
          ai_enabled: boolean;
          portal_branding_enabled: boolean;
          custom_domain_enabled: boolean;
          priority_support_enabled: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan: string;
          status?: string;
          seats_limit?: number | null;
          clients_limit?: number | null;
          monitoring_limit?: number | null;
          api_enabled?: boolean;
          webhooks_enabled?: boolean;
          ai_enabled?: boolean;
          portal_branding_enabled?: boolean;
          custom_domain_enabled?: boolean;
          priority_support_enabled?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan?: string;
          status?: string;
          seats_limit?: number | null;
          clients_limit?: number | null;
          monitoring_limit?: number | null;
          api_enabled?: boolean;
          webhooks_enabled?: boolean;
          ai_enabled?: boolean;
          portal_branding_enabled?: boolean;
          custom_domain_enabled?: boolean;
          priority_support_enabled?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_plan_overrides_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      predictive_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          snapshot_date: string;
          health_score: number | null;
          risk_score: number | null;
          incident_count: number | null;
          breach_count: number | null;
          monitoring_failures: number | null;
          engagement_score: number | null;
          predicted_health: number | null;
          predicted_risk: number | null;
          predicted_incidents: number | null;
          confidence: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          snapshot_date: string;
          health_score?: number | null;
          risk_score?: number | null;
          incident_count?: number | null;
          breach_count?: number | null;
          monitoring_failures?: number | null;
          engagement_score?: number | null;
          predicted_health?: number | null;
          predicted_risk?: number | null;
          predicted_incidents?: number | null;
          confidence?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string | null;
          snapshot_date?: string;
          health_score?: number | null;
          risk_score?: number | null;
          incident_count?: number | null;
          breach_count?: number | null;
          monitoring_failures?: number | null;
          engagement_score?: number | null;
          predicted_health?: number | null;
          predicted_risk?: number | null;
          predicted_incidents?: number | null;
          confidence?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictive_snapshots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictive_snapshots_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      predictive_activity: {
        Row: {
          id: string;
          organization_id: string;
          event_type: string;
          message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: string;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: string;
          message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictive_activity_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      white_label_settings: {
        Row: {
          id: string;
          organization_id: string;
          company_name: string;
          platform_name: string | null;
          logo_light: string | null;
          logo_dark: string | null;
          favicon: string | null;
          login_background: string | null;
          dashboard_background: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          success_color: string;
          warning_color: string;
          danger_color: string;
          support_email: string | null;
          support_url: string | null;
          website: string | null;
          privacy_url: string | null;
          terms_url: string | null;
          custom_css: string | null;
          custom_domain: string | null;
          domain_verification_status: WhiteLabelDomainVerificationStatus;
          domain_ssl_status: WhiteLabelDomainSslStatus;
          domain_verified_at: string | null;
          email_sender_name: string | null;
          email_sender_address: string | null;
          portal_title: string | null;
          portal_description: string | null;
          portal_welcome_message: string | null;
          login_title: string | null;
          login_subtitle: string | null;
          login_welcome_message: string | null;
          pdf_footer: string | null;
          published_at: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          company_name: string;
          platform_name?: string | null;
          logo_light?: string | null;
          logo_dark?: string | null;
          favicon?: string | null;
          login_background?: string | null;
          dashboard_background?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          success_color?: string;
          warning_color?: string;
          danger_color?: string;
          support_email?: string | null;
          support_url?: string | null;
          website?: string | null;
          privacy_url?: string | null;
          terms_url?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          domain_verification_status?: WhiteLabelDomainVerificationStatus;
          domain_ssl_status?: WhiteLabelDomainSslStatus;
          domain_verified_at?: string | null;
          email_sender_name?: string | null;
          email_sender_address?: string | null;
          portal_title?: string | null;
          portal_description?: string | null;
          portal_welcome_message?: string | null;
          login_title?: string | null;
          login_subtitle?: string | null;
          login_welcome_message?: string | null;
          pdf_footer?: string | null;
          published_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          company_name?: string;
          platform_name?: string | null;
          logo_light?: string | null;
          logo_dark?: string | null;
          favicon?: string | null;
          login_background?: string | null;
          dashboard_background?: string | null;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          success_color?: string;
          warning_color?: string;
          danger_color?: string;
          support_email?: string | null;
          support_url?: string | null;
          website?: string | null;
          privacy_url?: string | null;
          terms_url?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          domain_verification_status?: WhiteLabelDomainVerificationStatus;
          domain_ssl_status?: WhiteLabelDomainSslStatus;
          domain_verified_at?: string | null;
          email_sender_name?: string | null;
          email_sender_address?: string | null;
          portal_title?: string | null;
          portal_description?: string | null;
          portal_welcome_message?: string | null;
          login_title?: string | null;
          login_subtitle?: string | null;
          login_welcome_message?: string | null;
          pdf_footer?: string | null;
          published_at?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "white_label_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_usage_events: {
        Row: {
          id: string;
          organization_id: string;
          metric: string;
          quantity: number;
          unit: string | null;
          metadata: Record<string, unknown>;
          billing_period_start: string;
          billing_period_end: string;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          metric: string;
          quantity?: number;
          unit?: string | null;
          metadata?: Record<string, unknown>;
          billing_period_start: string;
          billing_period_end: string;
          recorded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          metric?: string;
          quantity?: number;
          unit?: string | null;
          metadata?: Record<string, unknown>;
          billing_period_start?: string;
          billing_period_end?: string;
          recorded_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_usage_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_usage_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          period_start: string;
          period_end: string;
          metrics: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          period_start: string;
          period_end: string;
          metrics?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          period_start?: string;
          period_end?: string;
          metrics?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_usage_snapshots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_invoices: {
        Row: {
          id: string;
          organization_id: string;
          stripe_invoice_id: string;
          stripe_customer_id: string | null;
          status: string;
          amount_due: number;
          amount_paid: number;
          currency: string;
          due_at: string | null;
          paid_at: string | null;
          invoice_pdf_url: string | null;
          hosted_invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_invoice_id: string;
          stripe_customer_id?: string | null;
          status: string;
          amount_due?: number;
          amount_paid?: number;
          currency?: string;
          due_at?: string | null;
          paid_at?: string | null;
          invoice_pdf_url?: string | null;
          hosted_invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stripe_invoice_id?: string;
          stripe_customer_id?: string | null;
          status?: string;
          amount_due?: number;
          amount_paid?: number;
          currency?: string;
          due_at?: string | null;
          paid_at?: string | null;
          invoice_pdf_url?: string | null;
          hosted_invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_invoices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          percentage_off: number | null;
          amount_off: number | null;
          currency: string;
          max_redemptions: number | null;
          redemption_count: number;
          expires_at: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: "percentage" | "fixed";
          percentage_off?: number | null;
          amount_off?: number | null;
          currency?: string;
          max_redemptions?: number | null;
          redemption_count?: number;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed";
          percentage_off?: number | null;
          amount_off?: number | null;
          currency?: string;
          max_redemptions?: number | null;
          redemption_count?: number;
          expires_at?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          organization_id: string;
          event_type: string;
          stripe_event_id: string | null;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: string;
          stripe_event_id?: string | null;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: string;
          stripe_event_id?: string | null;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          event_type: string;
          severity: "info" | "low" | "medium" | "high" | "critical";
          ip_address: string | null;
          user_agent: string | null;
          source: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          event_type: string;
          severity?: "info" | "low" | "medium" | "high" | "critical";
          ip_address?: string | null;
          user_agent?: string | null;
          source?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          event_type?: string;
          severity?: "info" | "low" | "medium" | "high" | "critical";
          ip_address?: string | null;
          user_agent?: string | null;
          source?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_exports: {
        Row: {
          id: string;
          organization_id: string;
          requested_by: string | null;
          export_format: "csv" | "json" | "evidence";
          status: "pending" | "processing" | "completed" | "failed";
          filters: Record<string, unknown>;
          row_count: number;
          payload: Record<string, unknown> | null;
          error_message: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          requested_by?: string | null;
          export_format: "csv" | "json" | "evidence";
          status?: "pending" | "processing" | "completed" | "failed";
          filters?: Record<string, unknown>;
          row_count?: number;
          payload?: Record<string, unknown> | null;
          error_message?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          requested_by?: string | null;
          export_format?: "csv" | "json" | "evidence";
          status?: "pending" | "processing" | "completed" | "failed";
          filters?: Record<string, unknown>;
          row_count?: number;
          payload?: Record<string, unknown> | null;
          error_message?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_exports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_policies: {
        Row: {
          id: string;
          organization_id: string;
          framework: string;
          policy_key: string;
          title: string;
          status: "draft" | "active" | "deprecated";
          config: Record<string, unknown>;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          framework: string;
          policy_key: string;
          title: string;
          status?: "draft" | "active" | "deprecated";
          config?: Record<string, unknown>;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          framework?: string;
          policy_key?: string;
          title?: string;
          status?: "draft" | "active" | "deprecated";
          config?: Record<string, unknown>;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_policies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      retention_rules: {
        Row: {
          id: string;
          organization_id: string;
          data_category: string;
          retention_period: "30d" | "90d" | "180d" | "1y" | "3y" | "7y" | "forever";
          simulation_only: boolean;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_category: string;
          retention_period: "30d" | "90d" | "180d" | "1y" | "3y" | "7y" | "forever";
          simulation_only?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          data_category?: string;
          retention_period?: "30d" | "90d" | "180d" | "1y" | "3y" | "7y" | "forever";
          simulation_only?: boolean;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "retention_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      data_access_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          resource_type: string;
          resource_id: string | null;
          action: string;
          ip_address: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          resource_type: string;
          resource_id?: string | null;
          action: string;
          ip_address?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          resource_type?: string;
          resource_id?: string | null;
          action?: string;
          ip_address?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "data_access_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      security_incidents: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          severity: "low" | "medium" | "high" | "critical";
          status: "open" | "investigating" | "mitigated" | "resolved";
          impact: string | null;
          timeline: unknown[];
          affected_entities: unknown[];
          root_cause: string | null;
          mitigation: string | null;
          postmortem: string | null;
          reported_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          severity: "low" | "medium" | "high" | "critical";
          status?: "open" | "investigating" | "mitigated" | "resolved";
          impact?: string | null;
          timeline?: unknown[];
          affected_entities?: unknown[];
          root_cause?: string | null;
          mitigation?: string | null;
          postmortem?: string | null;
          reported_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          severity?: "low" | "medium" | "high" | "critical";
          status?: "open" | "investigating" | "mitigated" | "resolved";
          impact?: string | null;
          timeline?: unknown[];
          affected_entities?: unknown[];
          root_cause?: string | null;
          mitigation?: string | null;
          postmortem?: string | null;
          reported_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "security_incidents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      consent_records: {
        Row: {
          id: string;
          organization_id: string;
          subject_email: string;
          subject_type: string;
          consent_type: string;
          granted: boolean;
          recorded_at: string;
          withdrawn_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          subject_email: string;
          subject_type?: string;
          consent_type: string;
          granted?: boolean;
          recorded_at?: string;
          withdrawn_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          subject_email?: string;
          subject_type?: string;
          consent_type?: string;
          granted?: boolean;
          recorded_at?: string;
          withdrawn_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      gdpr_requests: {
        Row: {
          id: string;
          organization_id: string;
          request_type:
            | "access"
            | "deletion"
            | "export"
            | "correction"
            | "restriction"
            | "consent_withdrawal";
          subject_email: string;
          status: "open" | "processing" | "completed" | "rejected" | "expired";
          notes: string | null;
          requested_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          request_type:
            | "access"
            | "deletion"
            | "export"
            | "correction"
            | "restriction"
            | "consent_withdrawal";
          subject_email: string;
          status?: "open" | "processing" | "completed" | "rejected" | "expired";
          notes?: string | null;
          requested_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          request_type?:
            | "access"
            | "deletion"
            | "export"
            | "correction"
            | "restriction"
            | "consent_withdrawal";
          subject_email?: string;
          status?: "open" | "processing" | "completed" | "rejected" | "expired";
          notes?: string | null;
          requested_by?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gdpr_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      legal_holds: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          entity_type: string | null;
          entity_id: string | null;
          active: boolean;
          created_by: string | null;
          released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          active?: boolean;
          created_by?: string | null;
          released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          active?: boolean;
          created_by?: string | null;
          released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legal_holds_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          status: "processing" | "processed" | "failed" | "duplicate";
          organization_id: string | null;
          retry_count: number;
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
          last_attempt_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          status: "processing" | "processed" | "failed" | "duplicate";
          organization_id?: string | null;
          retry_count?: number;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          last_attempt_at?: string;
        };
        Update: {
          id?: string;
          stripe_event_id?: string;
          event_type?: string;
          status?: "processing" | "processed" | "failed" | "duplicate";
          organization_id?: string | null;
          retry_count?: number;
          error_message?: string | null;
          received_at?: string;
          processed_at?: string | null;
          last_attempt_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      paddle_webhook_events: {
        Row: {
          id: string;
          provider: string;
          provider_event_id: string;
          event_type: string;
          occurred_at: string | null;
          received_at: string;
          processed_at: string | null;
          status: "processing" | "processed" | "failed" | "duplicate" | "ignored";
          last_error: string | null;
          payload_hash: string | null;
          organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          provider_event_id: string;
          event_type: string;
          occurred_at?: string | null;
          received_at?: string;
          processed_at?: string | null;
          status?: "processing" | "processed" | "failed" | "duplicate" | "ignored";
          last_error?: string | null;
          payload_hash?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          provider_event_id?: string;
          event_type?: string;
          occurred_at?: string | null;
          received_at?: string;
          processed_at?: string | null;
          status?: "processing" | "processed" | "failed" | "duplicate" | "ignored";
          last_error?: string | null;
          payload_hash?: string | null;
          organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "paddle_webhook_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      billing_provider_transactions: {
        Row: {
          id: string;
          organization_id: string;
          billing_provider: "stripe" | "paddle";
          provider_transaction_id: string;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          provider_price_id: string | null;
          status: string;
          amount_total: number | null;
          amount_subtotal: number | null;
          amount_tax: number | null;
          currency: string;
          occurred_at: string | null;
          paid_at: string | null;
          invoice_url: string | null;
          invoice_number: string | null;
          product_name: string | null;
          payment_method_summary: string | null;
          billing_period_start: string | null;
          billing_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          billing_provider: "stripe" | "paddle";
          provider_transaction_id: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          provider_price_id?: string | null;
          status: string;
          amount_total?: number | null;
          amount_subtotal?: number | null;
          amount_tax?: number | null;
          currency?: string;
          occurred_at?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          invoice_number?: string | null;
          product_name?: string | null;
          payment_method_summary?: string | null;
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          billing_provider?: "stripe" | "paddle";
          provider_transaction_id?: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          provider_price_id?: string | null;
          status?: string;
          amount_total?: number | null;
          amount_subtotal?: number | null;
          amount_tax?: number | null;
          currency?: string;
          occurred_at?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          invoice_number?: string | null;
          product_name?: string | null;
          payment_method_summary?: string | null;
          billing_period_start?: string | null;
          billing_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_provider_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      job_definitions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          schedule_cron: string | null;
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          schedule_cron?: string | null;
          enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          schedule_cron?: string | null;
          enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      job_schedules: {
        Row: {
          job_id: string;
          next_run_at: string;
          last_run_at: string | null;
          locked_until: string | null;
          lock_token: string | null;
        };
        Insert: {
          job_id: string;
          next_run_at: string;
          last_run_at?: string | null;
          locked_until?: string | null;
          lock_token?: string | null;
        };
        Update: {
          job_id?: string;
          next_run_at?: string;
          last_run_at?: string | null;
          locked_until?: string | null;
          lock_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "job_schedules_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "job_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      job_executions: {
        Row: {
          id: string;
          job_id: string;
          organization_id: string | null;
          status: "pending" | "running" | "completed" | "failed";
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          job_id: string;
          organization_id?: string | null;
          status: "pending" | "running" | "completed" | "failed";
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          job_id?: string;
          organization_id?: string | null;
          status?: "pending" | "running" | "completed" | "failed";
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "job_executions_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "job_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_executions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_jobs: {
        Row: {
          id: string;
          queue_name: string;
          organization_id: string | null;
          job_type: string;
          payload: Record<string, unknown>;
          status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
          priority: number;
          attempts: number;
          max_attempts: number;
          scheduled_at: string;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          queue_name: string;
          organization_id?: string | null;
          job_type: string;
          payload?: Record<string, unknown>;
          status: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
          priority?: number;
          attempts?: number;
          max_attempts?: number;
          scheduled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          queue_name?: string;
          organization_id?: string | null;
          job_type?: string;
          payload?: Record<string, unknown>;
          status?: "pending" | "running" | "completed" | "failed" | "cancelled" | "paused";
          priority?: number;
          attempts?: number;
          max_attempts?: number;
          scheduled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_dead_letters: {
        Row: {
          id: string;
          queue_job_id: string;
          queue_name: string;
          organization_id: string | null;
          job_type: string;
          payload: Record<string, unknown>;
          error_message: string | null;
          attempts: number;
          dead_at: string;
        };
        Insert: {
          id?: string;
          queue_job_id: string;
          queue_name: string;
          organization_id?: string | null;
          job_type: string;
          payload?: Record<string, unknown>;
          error_message?: string | null;
          attempts?: number;
          dead_at?: string;
        };
        Update: {
          id?: string;
          queue_job_id?: string;
          queue_name?: string;
          organization_id?: string | null;
          job_type?: string;
          payload?: Record<string, unknown>;
          error_message?: string | null;
          attempts?: number;
          dead_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_dead_letters_queue_job_id_fkey";
            columns: ["queue_job_id"];
            isOneToOne: false;
            referencedRelation: "queue_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_dead_letters_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_leads: {
        Row: {
          id: string;
          organization_id: string;
          pipeline_stage: SalesPipelineStage;
          lead_source: SalesLeadSource;
          inbox_key: SalesInboxKey;
          contact_name: string;
          contact_email: string;
          company_name: string | null;
          company_size: string | null;
          website: string | null;
          industry: string | null;
          employee_count: number | null;
          pain_points: string | null;
          lead_value: number | null;
          mrr_estimate: number | null;
          owner_user_id: string | null;
          next_followup_at: string | null;
          last_contact_at: string | null;
          notes: string | null;
          message: string | null;
          calendly_event_url: string | null;
          google_meet_url: string | null;
          booking_link: string | null;
          referral_code: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          converted_organization_id: string | null;
          is_founding_customer: boolean;
          founding_discount_percent: number;
          linkedin_url: string | null;
          location: string | null;
          arr_estimate: number | null;
          potential_mrr: number | null;
          pain_score: number | null;
          fit_score: number | null;
          priority_score: number | null;
          prospect_segment: ProspectSegment | null;
          outbound_list_id: string | null;
          last_outreach_at: string | null;
          outreach_sequence_step: number;
          no_response_flag: boolean;
          escalated_at: string | null;
          source_region: LeadSourceRegion | null;
          agency_type: AgencyType | null;
          reply_received_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          pipeline_stage?: SalesPipelineStage;
          lead_source?: SalesLeadSource;
          inbox_key?: SalesInboxKey;
          contact_name: string;
          contact_email: string;
          company_name?: string | null;
          company_size?: string | null;
          website?: string | null;
          industry?: string | null;
          employee_count?: number | null;
          pain_points?: string | null;
          lead_value?: number | null;
          mrr_estimate?: number | null;
          owner_user_id?: string | null;
          next_followup_at?: string | null;
          last_contact_at?: string | null;
          notes?: string | null;
          message?: string | null;
          calendly_event_url?: string | null;
          google_meet_url?: string | null;
          booking_link?: string | null;
          referral_code?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          converted_organization_id?: string | null;
          is_founding_customer?: boolean;
          founding_discount_percent?: number;
          linkedin_url?: string | null;
          location?: string | null;
          arr_estimate?: number | null;
          potential_mrr?: number | null;
          pain_score?: number | null;
          fit_score?: number | null;
          priority_score?: number | null;
          prospect_segment?: ProspectSegment | null;
          outbound_list_id?: string | null;
          last_outreach_at?: string | null;
          outreach_sequence_step?: number;
          no_response_flag?: boolean;
          escalated_at?: string | null;
          source_region?: LeadSourceRegion | null;
          agency_type?: AgencyType | null;
          reply_received_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          pipeline_stage?: SalesPipelineStage;
          lead_source?: SalesLeadSource;
          inbox_key?: SalesInboxKey;
          contact_name?: string;
          contact_email?: string;
          company_name?: string | null;
          company_size?: string | null;
          website?: string | null;
          industry?: string | null;
          employee_count?: number | null;
          pain_points?: string | null;
          lead_value?: number | null;
          mrr_estimate?: number | null;
          owner_user_id?: string | null;
          next_followup_at?: string | null;
          last_contact_at?: string | null;
          notes?: string | null;
          message?: string | null;
          calendly_event_url?: string | null;
          google_meet_url?: string | null;
          booking_link?: string | null;
          referral_code?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          converted_organization_id?: string | null;
          is_founding_customer?: boolean;
          founding_discount_percent?: number;
          linkedin_url?: string | null;
          location?: string | null;
          arr_estimate?: number | null;
          potential_mrr?: number | null;
          pain_score?: number | null;
          fit_score?: number | null;
          priority_score?: number | null;
          prospect_segment?: ProspectSegment | null;
          outbound_list_id?: string | null;
          last_outreach_at?: string | null;
          outreach_sequence_step?: number;
          no_response_flag?: boolean;
          escalated_at?: string | null;
          source_region?: LeadSourceRegion | null;
          agency_type?: AgencyType | null;
          reply_received_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_lead_activities: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          activity_type: string;
          subject: string | null;
          body: string | null;
          created_by_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          activity_type?: string;
          subject?: string | null;
          body?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          activity_type?: string;
          subject?: string | null;
          body?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "sales_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      outbound_lists: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          list_type: OutboundListType;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          list_type?: OutboundListType;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          list_type?: OutboundListType;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outbound_lists_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_lead_reminders: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          reminder_type: string;
          subject: string | null;
          due_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          reminder_type?: string;
          subject?: string | null;
          due_at: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          reminder_type?: string;
          subject?: string | null;
          due_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_lead_reminders_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "sales_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_success_records: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string | null;
          customer_organization_id: string | null;
          onboarding_complete: boolean;
          milestones_completed: number;
          milestones_total: number;
          adoption_score: number;
          usage_score: number;
          success_score: number;
          risk_score: number;
          renewal_probability: number;
          pilot_started_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          onboarding_complete?: boolean;
          milestones_completed?: number;
          milestones_total?: number;
          adoption_score?: number;
          usage_score?: number;
          success_score?: number;
          risk_score?: number;
          renewal_probability?: number;
          pilot_started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          onboarding_complete?: boolean;
          milestones_completed?: number;
          milestones_total?: number;
          adoption_score?: number;
          usage_score?: number;
          success_score?: number;
          risk_score?: number;
          renewal_probability?: number;
          pilot_started_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_success_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_proposals: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          title: string;
          status: SalesProposalStatus;
          pilot_agreement: string | null;
          pricing_proposal: string | null;
          roi_estimate: string | null;
          timeline: string | null;
          implementation_plan: string | null;
          mrr_proposed: number | null;
          arr_proposed: number | null;
          pdf_generated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          title?: string;
          status?: SalesProposalStatus;
          pilot_agreement?: string | null;
          pricing_proposal?: string | null;
          roi_estimate?: string | null;
          timeline?: string | null;
          implementation_plan?: string | null;
          mrr_proposed?: number | null;
          arr_proposed?: number | null;
          pdf_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          title?: string;
          status?: SalesProposalStatus;
          pilot_agreement?: string | null;
          pricing_proposal?: string | null;
          roi_estimate?: string | null;
          timeline?: string | null;
          implementation_plan?: string | null;
          mrr_proposed?: number | null;
          arr_proposed?: number | null;
          pdf_generated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_proposals_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "sales_leads";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_onboarding_records: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string | null;
          customer_organization_id: string | null;
          kickoff_scheduled_at: string | null;
          kickoff_completed_at: string | null;
          workspace_created: boolean;
          checklist_completed: number;
          checklist_total: number;
          team_invited: boolean;
          integrations_connected: boolean;
          diagnostics_baseline: boolean;
          health_baseline_score: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          kickoff_scheduled_at?: string | null;
          kickoff_completed_at?: string | null;
          workspace_created?: boolean;
          checklist_completed?: number;
          checklist_total?: number;
          team_invited?: boolean;
          integrations_connected?: boolean;
          diagnostics_baseline?: boolean;
          health_baseline_score?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          kickoff_scheduled_at?: string | null;
          kickoff_completed_at?: string | null;
          workspace_created?: boolean;
          checklist_completed?: number;
          checklist_total?: number;
          team_invited?: boolean;
          integrations_connected?: boolean;
          diagnostics_baseline?: boolean;
          health_baseline_score?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_onboarding_records_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      portal_customer_onboarding: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string | null;
          customer_organization_id: string | null;
          client_id: string | null;
          onboarding_status: string;
          milestones_completed: number;
          milestones_total: number;
          open_tasks: number;
          feedback: string | null;
          satisfaction_score: number | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          client_id?: string | null;
          onboarding_status?: string;
          milestones_completed?: number;
          milestones_total?: number;
          open_tasks?: number;
          feedback?: string | null;
          satisfaction_score?: number | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          client_id?: string | null;
          onboarding_status?: string;
          milestones_completed?: number;
          milestones_total?: number;
          open_tasks?: number;
          feedback?: string | null;
          satisfaction_score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "portal_customer_onboarding_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      founding_program_enrollments: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string | null;
          customer_organization_id: string | null;
          slot_number: number;
          discount_percent: number;
          lifetime_discount: boolean;
          founding_badge: boolean;
          roadmap_influence: boolean;
          priority_support: boolean;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          slot_number: number;
          discount_percent?: number;
          lifetime_discount?: boolean;
          founding_badge?: boolean;
          roadmap_influence?: boolean;
          priority_support?: boolean;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string | null;
          customer_organization_id?: string | null;
          slot_number?: number;
          discount_percent?: number;
          lifetime_discount?: boolean;
          founding_badge?: boolean;
          roadmap_influence?: boolean;
          priority_support?: boolean;
          enrolled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "founding_program_enrollments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_activation_preferences: {
        Row: {
          organization_id: string;
          welcome_dismissed_at: string | null;
          onboarding_dismissed_at: string | null;
          onboarding_last_viewed_at: string | null;
          activation_milestone_reached_at: string | null;
          activation_panel_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          welcome_dismissed_at?: string | null;
          onboarding_dismissed_at?: string | null;
          onboarding_last_viewed_at?: string | null;
          activation_milestone_reached_at?: string | null;
          activation_panel_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          welcome_dismissed_at?: string | null;
          onboarding_dismissed_at?: string | null;
          onboarding_last_viewed_at?: string | null;
          activation_milestone_reached_at?: string | null;
          activation_panel_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_activation_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_adoption_preferences: {
        Row: {
          organization_id: string;
          last_viewed_at: string | null;
          summary_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          last_viewed_at?: string | null;
          summary_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          last_viewed_at?: string | null;
          summary_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_adoption_preferences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_success_playbook_instances: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          playbook_key: string;
          status: string;
          priority: string;
          assigned_to_user_id: string | null;
          started_by_user_id: string;
          started_at: string;
          due_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          trigger_code: string | null;
          trigger_snapshot: Json | null;
          outcome: string | null;
          recovery_score_before: number | null;
          recovery_score_after: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          playbook_key: string;
          status?: string;
          priority?: string;
          assigned_to_user_id?: string | null;
          started_by_user_id: string;
          started_at?: string;
          due_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          trigger_code?: string | null;
          trigger_snapshot?: Json | null;
          outcome?: string | null;
          recovery_score_before?: number | null;
          recovery_score_after?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          playbook_key?: string;
          status?: string;
          priority?: string;
          assigned_to_user_id?: string | null;
          started_by_user_id?: string;
          started_at?: string;
          due_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          trigger_code?: string | null;
          trigger_snapshot?: Json | null;
          outcome?: string | null;
          recovery_score_before?: number | null;
          recovery_score_after?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_success_playbook_instances_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_success_playbook_instances_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_success_tasks: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string;
          playbook_instance_id: string;
          task_key: string;
          title: string;
          description: string | null;
          status: string;
          required: boolean;
          assigned_to_user_id: string | null;
          due_at: string | null;
          completed_at: string | null;
          completed_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id: string;
          playbook_instance_id: string;
          task_key: string;
          title: string;
          description?: string | null;
          status?: string;
          required?: boolean;
          assigned_to_user_id?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          completed_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string;
          playbook_instance_id?: string;
          task_key?: string;
          title?: string;
          description?: string | null;
          status?: string;
          required?: boolean;
          assigned_to_user_id?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          completed_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_success_tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_success_tasks_playbook_instance_id_fkey";
            columns: ["playbook_instance_id"];
            isOneToOne: false;
            referencedRelation: "customer_success_playbook_instances";
            referencedColumns: ["id"];
          },
        ];
      };
      executive_intelligence_briefings: {
        Row: {
          id: string;
          organization_id: string;
          period_key: string;
          period_start: string;
          period_end: string;
          comparison_start: string;
          comparison_end: string;
          snapshot: Json;
          deterministic_narrative: string;
          ai_narrative: string | null;
          generated_by: string;
          generated_by_user_id: string | null;
          provider: string | null;
          model: string | null;
          status: string;
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          period_key: string;
          period_start: string;
          period_end: string;
          comparison_start: string;
          comparison_end: string;
          snapshot: Json;
          deterministic_narrative: string;
          ai_narrative?: string | null;
          generated_by: string;
          generated_by_user_id?: string | null;
          provider?: string | null;
          model?: string | null;
          status?: string;
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          period_key?: string;
          period_start?: string;
          period_end?: string;
          comparison_start?: string;
          comparison_end?: string;
          snapshot?: Json;
          deterministic_narrative?: string;
          ai_narrative?: string | null;
          generated_by?: string;
          generated_by_user_id?: string | null;
          provider?: string | null;
          model?: string | null;
          status?: string;
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "executive_intelligence_briefings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type AppUser = Database["public"]["Tables"]["users"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientPortalUser = Database["public"]["Tables"]["client_portal_users"]["Row"];
export type Risk = Database["public"]["Tables"]["risks"]["Row"];
export type ClientRisk = Database["public"]["Tables"]["client_risks"]["Row"];
export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportSchedule = Database["public"]["Tables"]["report_schedules"]["Row"];
export type ReportTemplate = Database["public"]["Tables"]["report_templates"]["Row"];
export type ReportEmailDelivery = Database["public"]["Tables"]["report_email_deliveries"]["Row"];
export type OrganizationEmailSettings =
  Database["public"]["Tables"]["organization_email_settings"]["Row"];
export type OrganizationBranding = Database["public"]["Tables"]["organization_branding"]["Row"];
export type OrganizationSubscription =
  Database["public"]["Tables"]["organization_subscriptions"]["Row"];
export type BillingProviderTransaction =
  Database["public"]["Tables"]["billing_provider_transactions"]["Row"];
export type SlaPolicy = Database["public"]["Tables"]["sla_policies"]["Row"];
export type EscalationRule = Database["public"]["Tables"]["escalation_rules"]["Row"];
export type EscalationExecution = Database["public"]["Tables"]["escalation_executions"]["Row"];
export type ClientFinancial = Database["public"]["Tables"]["client_financials"]["Row"];
export type TeamInvitation = Database["public"]["Tables"]["team_invitations"]["Row"];
export type ActivityEvent = Database["public"]["Tables"]["activity_events"]["Row"];
export type AIUsageEvent = Database["public"]["Tables"]["ai_usage_events"]["Row"];
export type AIRequestLog = Database["public"]["Tables"]["ai_request_logs"]["Row"];
export type PlatformOpenAIHealthCheck =
  Database["public"]["Tables"]["platform_openai_health_checks"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AutomationWorkflow = Database["public"]["Tables"]["automation_workflows"]["Row"];
export type AutomationWorkflowVersion =
  Database["public"]["Tables"]["automation_workflow_versions"]["Row"];
export type AutomationExecution = Database["public"]["Tables"]["automation_executions"]["Row"];
export type AutomationExecutionStep =
  Database["public"]["Tables"]["automation_execution_steps"]["Row"];
export type AutomationWebhook = Database["public"]["Tables"]["automation_webhooks"]["Row"];
export type AutomationOrgState = Database["public"]["Tables"]["automation_org_state"]["Row"];
export type IntegrationSecret = Database["public"]["Tables"]["integration_secrets"]["Row"];
export type IntegrationDeliveryLog = Database["public"]["Tables"]["integration_delivery_logs"]["Row"];
export type IntegrationConnection = Database["public"]["Tables"]["integration_connections"]["Row"];
export type IntegrationOAuthState = Database["public"]["Tables"]["integration_oauth_states"]["Row"];
export type IntegrationSyncJob = Database["public"]["Tables"]["integration_sync_jobs"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiRequestLog = Database["public"]["Tables"]["api_request_logs"]["Row"];
export type ApiWebhookEndpoint = Database["public"]["Tables"]["api_webhook_endpoints"]["Row"];
export type ApiWebhookDelivery = Database["public"]["Tables"]["api_webhook_deliveries"]["Row"];
export type WebhookEndpoint = Database["public"]["Tables"]["webhook_endpoints"]["Row"];
export type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"];
export type EnterpriseRequest = Database["public"]["Tables"]["enterprise_requests"]["Row"];
export type OrganizationPlanOverride = Database["public"]["Tables"]["organization_plan_overrides"]["Row"];
export type PredictiveSnapshot = Database["public"]["Tables"]["predictive_snapshots"]["Row"];
export type PredictiveActivity = Database["public"]["Tables"]["predictive_activity"]["Row"];
export type WhiteLabelSettings = Database["public"]["Tables"]["white_label_settings"]["Row"];
export type BillingUsageEvent = Database["public"]["Tables"]["billing_usage_events"]["Row"];
export type SubscriptionUsageSnapshot =
  Database["public"]["Tables"]["subscription_usage_snapshots"]["Row"];
export type CustomerInvoice = Database["public"]["Tables"]["customer_invoices"]["Row"];
export type DiscountCode = Database["public"]["Tables"]["discount_codes"]["Row"];
export type BillingEvent = Database["public"]["Tables"]["billing_events"]["Row"];
export type AuditEvent = Database["public"]["Tables"]["audit_events"]["Row"];
export type AuditExport = Database["public"]["Tables"]["audit_exports"]["Row"];
export type CompliancePolicy = Database["public"]["Tables"]["compliance_policies"]["Row"];
export type RetentionRule = Database["public"]["Tables"]["retention_rules"]["Row"];
export type DataAccessLog = Database["public"]["Tables"]["data_access_logs"]["Row"];
export type SecurityIncident = Database["public"]["Tables"]["security_incidents"]["Row"];
export type ConsentRecord = Database["public"]["Tables"]["consent_records"]["Row"];
export type GdprRequest = Database["public"]["Tables"]["gdpr_requests"]["Row"];
export type LegalHold = Database["public"]["Tables"]["legal_holds"]["Row"];
export type StripeWebhookEvent = Database["public"]["Tables"]["stripe_webhook_events"]["Row"];
export type JobDefinition = Database["public"]["Tables"]["job_definitions"]["Row"];
export type JobSchedule = Database["public"]["Tables"]["job_schedules"]["Row"];
export type JobExecution = Database["public"]["Tables"]["job_executions"]["Row"];
export type QueueJobRow = Database["public"]["Tables"]["queue_jobs"]["Row"];
export type QueueDeadLetter = Database["public"]["Tables"]["queue_dead_letters"]["Row"];
export type SalesLead = Database["public"]["Tables"]["sales_leads"]["Row"];
export type SalesLeadActivity = Database["public"]["Tables"]["sales_lead_activities"]["Row"];
export type FoundingProgramEnrollment =
  Database["public"]["Tables"]["founding_program_enrollments"]["Row"];
export type OutboundList = Database["public"]["Tables"]["outbound_lists"]["Row"];
export type SalesLeadReminder = Database["public"]["Tables"]["sales_lead_reminders"]["Row"];
export type CustomerSuccessRecord =
  Database["public"]["Tables"]["customer_success_records"]["Row"];
export type SalesProposal = Database["public"]["Tables"]["sales_proposals"]["Row"];
export type CustomerOnboardingRecord =
  Database["public"]["Tables"]["customer_onboarding_records"]["Row"];
export type PortalCustomerOnboarding =
  Database["public"]["Tables"]["portal_customer_onboarding"]["Row"];
export type OrganizationActivationPreferences =
  Database["public"]["Tables"]["organization_activation_preferences"]["Row"];
