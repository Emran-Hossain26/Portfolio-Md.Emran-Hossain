// Auto-generated from supabase/migrations/20250104_initial_schema.sql
// Run with: npx tsx scripts/generate-types.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'created_at' | 'updated_at'>>;
      };
      site_settings: {
        Row: SiteSetting;
        Insert: Omit<SiteSetting, 'updated_at'>;
        Update: Partial<Omit<SiteSetting, 'updated_at'>>;
      };
      feature_flags: {
        Row: FeatureFlag;
        Insert: Omit<FeatureFlag, 'updated_at'>;
        Update: Partial<Omit<FeatureFlag, 'updated_at'>>;
      };
      sections: {
        Row: Section;
        Insert: Omit<Section, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Section, 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'created_at' | 'updated_at'>>;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BlogPost, 'created_at' | 'updated_at'>>;
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Testimonial, 'created_at' | 'updated_at'>>;
      };
      experiences: {
        Row: Experience;
        Insert: Omit<Experience, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Experience, 'created_at' | 'updated_at'>>;
      };
      educations: {
        Row: Education;
        Insert: Omit<Education, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Education, 'created_at' | 'updated_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'created_at' | 'updated_at'>>;
      };
      theme_presets: {
        Row: ThemePreset;
        Insert: Omit<ThemePreset, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ThemePreset, 'created_at' | 'updated_at'>>;
      };
      page_seo: {
        Row: PageSEO;
        Insert: Omit<PageSEO, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PageSEO, 'created_at' | 'updated_at'>>;
      };
      redirects: {
        Row: Redirect;
        Insert: Omit<Redirect, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Redirect, 'created_at' | 'updated_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AuditLog, 'created_at' | 'updated_at'>>;
      };
      visitor_events: {
        Row: VisitorEvent;
        Insert: Omit<VisitorEvent, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VisitorEvent, 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: 'super_admin' | 'editor';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  updated_at: string;
}

export interface Section {
  id: string;
  key: string;
  sort_order: number;
  enabled: boolean;
  content: {
    en: Record<string, unknown>;
    bn: Record<string, unknown>;
  };
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  desc_en: string;
  desc_bn: string;
  tags: string[];
  href: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  meta_en: string;
  meta_bn: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  category: string | null;
  tags: string[];
  cover_url: string | null;
  reading_time_en: number;
  reading_time_bn: number;
  view_count: number;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  quote_en: string;
  quote_bn: string;
  rating: number;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  role_en: string;
  role_bn: string;
  org_en: string;
  org_bn: string;
  period: string;
  details: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  degree_en: string;
  degree_bn: string;
  org_en: string;
  org_bn: string;
  period: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'spam';
  created_at: string;
  updated_at: string;
}

export interface ThemePreset {
  id: string;
  name_en: string;
  name_bn: string;
  is_default: boolean;
  is_enabled: boolean;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PageSEO {
  id: string;
  path: string;
  lang: 'en' | 'bn';
  title: string | null;
  description: string | null;
  og_image: string | null;
  canonical: string | null;
  robots: string;
  created_at: string;
  updated_at: string;
}

export interface Redirect {
  id: string;
  from_url: string;
  to_url: string;
  permanent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface VisitorEvent {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  theme: string | null;
  effects_on: boolean | null;
  created_at: string;
}

// Site settings keys
export const SiteSettingKeys = {
  HERO_TEXTS: 'hero_texts',
  THEME_LIGHT: 'theme_light',
  THEME_DARK: 'theme_dark',
  THEME_CYBER: 'theme_cyber',
  THEME_AURORA: 'theme_aurora',
  FEATURES: 'features',
  SITE_EXTRAS: 'site_extras',
} as const;

// Feature flag keys
export const FeatureFlagKeys = {
  CURSOR_FX: 'cursor_fx',
  CURSOR_FX_DEFAULT: 'cursor_fx_default',
  THEME_PICKER: 'theme_picker',
  STATS: 'stats',
  CERTIFICATIONS: 'certifications',
  FAQ: 'faq',
  AVAILABILITY: 'availability',
} as const;

// Section keys
export const SectionKeys = {
  HERO: 'hero',
  EXPERTISE: 'expertise',
  PROJECTS: 'projects',
  TESTIMONIALS: 'testimonials',
  BLOG: 'blog',
  CONTACT: 'contact',
} as const;
