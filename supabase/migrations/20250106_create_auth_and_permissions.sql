-- Migration : Système de gestion des droits multi-rôles
-- Date : 2025-01-06
-- Description : Création des tables pour l'authentification et la gestion des permissions

-- ==================================================
-- 1. TABLE PROFILES (Profils utilisateurs)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'standard')) DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- 2. TABLE SALES_CHANNELS (Canaux de vente)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.sales_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_channels_name ON public.sales_channels(name);

CREATE TRIGGER sales_channels_updated_at
  BEFORE UPDATE ON public.sales_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- 3. TABLE USER_CHANNELS (Assignation utilisateur-canal)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.user_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX idx_user_channels_user ON public.user_channels(user_id);
CREATE INDEX idx_user_channels_channel ON public.user_channels(channel_id);

-- ==================================================
-- 4. TABLE TAGS (Étiquettes)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_name ON public.tags(name);

-- ==================================================
-- 5. TABLE STANDARD_ARTICLES (Articles standards)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.standard_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  prix_achat DECIMAL(10,2),
  prix_vente DECIMAL(10,2),
  quantite INTEGER DEFAULT 0,
  categorie TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.sales_channels(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('en_vente', 'accepte', 'vendu', 'archive')) DEFAULT 'en_vente',
  date_acceptation TIMESTAMPTZ,
  date_vente TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_standard_articles_creator ON public.standard_articles(created_by);
CREATE INDEX idx_standard_articles_channel ON public.standard_articles(channel_id);
CREATE INDEX idx_standard_articles_status ON public.standard_articles(status);

CREATE TRIGGER standard_articles_updated_at
  BEFORE UPDATE ON public.standard_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================
-- 6. TABLE STANDARD_ARTICLE_PHOTOS (Photos d'articles standards)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.standard_article_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.standard_articles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_standard_article_photos_article ON public.standard_article_photos(article_id);

-- ==================================================
-- 7. TABLE ARTICLE_TAGS (Liaison articles-tags)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.article_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.standard_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

CREATE INDEX idx_article_tags_article ON public.article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON public.article_tags(tag_id);

-- ==================================================
-- 8. TABLE VIN_TAGS (Liaison vins-tags)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.vin_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin_id UUID NOT NULL REFERENCES public.vins(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vin_id, tag_id)
);

CREATE INDEX idx_vin_tags_vin ON public.vin_tags(vin_id);
CREATE INDEX idx_vin_tags_tag ON public.vin_tags(tag_id);

-- ==================================================
-- 9. MODIFICATIONS TABLE VINS (Ajout des champs pour canaux et statuts)
-- ==================================================
ALTER TABLE public.vins
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.sales_channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('en_vente', 'accepte', 'vendu', 'archive')) DEFAULT 'en_vente',
  ADD COLUMN IF NOT EXISTS date_acceptation TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_vente TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vins_created_by ON public.vins(created_by);
CREATE INDEX IF NOT EXISTS idx_vins_channel ON public.vins(channel_id);
CREATE INDEX IF NOT EXISTS idx_vins_status ON public.vins(status);

-- ==================================================
-- 10. ROW LEVEL SECURITY (RLS) - Activation
-- ==================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_article_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vin_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vins ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- 11. POLICIES RLS - PROFILES
-- ==================================================

-- Tout le monde peut voir son propre profil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin peut voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin peut modifier tous les profils
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin peut supprimer tous les profils
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin peut créer des profils
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 12. POLICIES RLS - SALES_CHANNELS
-- ==================================================

-- Tout le monde peut voir les canaux
CREATE POLICY "All authenticated users can view channels"
  ON public.sales_channels FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seul admin peut créer/modifier/supprimer des canaux
CREATE POLICY "Only admins can insert channels"
  ON public.sales_channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update channels"
  ON public.sales_channels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete channels"
  ON public.sales_channels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 13. POLICIES RLS - USER_CHANNELS
-- ==================================================

-- Tout le monde peut voir ses propres assignations
CREATE POLICY "Users can view own channel assignments"
  ON public.user_channels FOR SELECT
  USING (auth.uid() = user_id);

-- Admin peut voir toutes les assignations
CREATE POLICY "Admins can view all channel assignments"
  ON public.user_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seul admin peut créer/modifier/supprimer des assignations
CREATE POLICY "Only admins can manage channel assignments"
  ON public.user_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 14. POLICIES RLS - TAGS
-- ==================================================

-- Tout le monde peut voir les tags
CREATE POLICY "All authenticated users can view tags"
  ON public.tags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin et moderator peuvent créer des tags
CREATE POLICY "Admins and moderators can insert tags"
  ON public.tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Seul admin peut modifier/supprimer des tags
CREATE POLICY "Only admins can update tags"
  ON public.tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete tags"
  ON public.tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 15. POLICIES RLS - STANDARD_ARTICLES
-- ==================================================

-- Tout le monde peut voir les articles
CREATE POLICY "All authenticated users can view standard articles"
  ON public.standard_articles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Tout le monde peut créer des articles
CREATE POLICY "All authenticated users can insert standard articles"
  ON public.standard_articles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Admin peut modifier tous les articles
CREATE POLICY "Admins can update all standard articles"
  ON public.standard_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent modifier leurs propres articles
CREATE POLICY "Users can update own standard articles"
  ON public.standard_articles FOR UPDATE
  USING (auth.uid() = created_by);

-- Admin peut supprimer tous les articles
CREATE POLICY "Admins can delete all standard articles"
  ON public.standard_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent supprimer leurs propres articles
CREATE POLICY "Users can delete own standard articles"
  ON public.standard_articles FOR DELETE
  USING (auth.uid() = created_by);

-- ==================================================
-- 16. POLICIES RLS - STANDARD_ARTICLE_PHOTOS
-- ==================================================

-- Tout le monde peut voir les photos
CREATE POLICY "All authenticated users can view article photos"
  ON public.standard_article_photos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Les créateurs d'articles peuvent gérer les photos
CREATE POLICY "Article owners can manage photos"
  ON public.standard_article_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_articles
      WHERE id = article_id AND created_by = auth.uid()
    )
  );

-- Admin peut gérer toutes les photos
CREATE POLICY "Admins can manage all article photos"
  ON public.standard_article_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 17. POLICIES RLS - ARTICLE_TAGS
-- ==================================================

-- Tout le monde peut voir les tags d'articles
CREATE POLICY "All authenticated users can view article tags"
  ON public.article_tags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Les créateurs d'articles peuvent gérer leurs tags
CREATE POLICY "Article owners can manage article tags"
  ON public.article_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_articles
      WHERE id = article_id AND created_by = auth.uid()
    )
  );

-- Admin peut gérer tous les tags d'articles
CREATE POLICY "Admins can manage all article tags"
  ON public.article_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 18. POLICIES RLS - VIN_TAGS
-- ==================================================

-- Tout le monde peut voir les tags de vins
CREATE POLICY "All authenticated users can view vin tags"
  ON public.vin_tags FOR SELECT
  USING (auth.role() = 'authenticated');

-- Les créateurs de vins peuvent gérer leurs tags
CREATE POLICY "Vin owners can manage vin tags"
  ON public.vin_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vins
      WHERE id = vin_id AND created_by = auth.uid()
    )
  );

-- Admin peut gérer tous les tags de vins
CREATE POLICY "Admins can manage all vin tags"
  ON public.vin_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 19. POLICIES RLS - VINS (Modification des politiques existantes)
-- ==================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "All authenticated users can view vins" ON public.vins;
DROP POLICY IF EXISTS "All authenticated users can insert vins" ON public.vins;
DROP POLICY IF EXISTS "Users can update own vins" ON public.vins;
DROP POLICY IF EXISTS "Admins can update all vins" ON public.vins;
DROP POLICY IF EXISTS "Users can delete own vins" ON public.vins;
DROP POLICY IF EXISTS "Admins can delete all vins" ON public.vins;

-- Tout le monde peut voir les vins
CREATE POLICY "All authenticated users can view vins"
  ON public.vins FOR SELECT
  USING (auth.role() = 'authenticated');

-- Tout le monde peut créer des vins
CREATE POLICY "All authenticated users can insert vins"
  ON public.vins FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Admin peut modifier tous les vins
CREATE POLICY "Admins can update all vins"
  ON public.vins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent modifier leurs propres vins
CREATE POLICY "Users can update own vins"
  ON public.vins FOR UPDATE
  USING (auth.uid() = created_by);

-- Admin peut supprimer tous les vins
CREATE POLICY "Admins can delete all vins"
  ON public.vins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent supprimer leurs propres vins
CREATE POLICY "Users can delete own vins"
  ON public.vins FOR DELETE
  USING (auth.uid() = created_by);

-- ==================================================
-- 20. FONCTION POUR CRÉER UN PROFIL AUTOMATIQUEMENT
-- ==================================================

-- Fonction trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'standard');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
