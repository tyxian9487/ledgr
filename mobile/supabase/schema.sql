-- Run this in the Supabase SQL Editor after creating your project.

-- User profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id        UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name      TEXT,
  email     TEXT,
  avatar    TEXT,
  plan      TEXT DEFAULT 'free',
  currency  TEXT DEFAULT 'USD',
  language  TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access only their own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cloud data storage (one row per user, synced from device)
CREATE TABLE user_data (
  user_id                  UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  transactions             JSONB NOT NULL DEFAULT '[]',
  budget                   JSONB NOT NULL DEFAULT '{}',
  custom_categories        JSONB NOT NULL DEFAULT '[]',
  disabled_categories      TEXT[] NOT NULL DEFAULT '{}',
  dark_mode                BOOLEAN NOT NULL DEFAULT false,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT false,
  analytics_consent        BOOLEAN,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own data"
  ON user_data FOR ALL USING (auth.uid() = user_id);
