-- Migration : Restriction des permissions pour les utilisateurs standard
-- Date : 2025-01-07
-- Description : Les utilisateurs standard ont accès en lecture seule (pas de création/modification/suppression)

-- ==================================================
-- VINS : Restriction des permissions INSERT/UPDATE/DELETE
-- ==================================================

-- Supprimer les anciennes policies trop permissives pour les users standard
DROP POLICY IF EXISTS "All authenticated users can insert vins" ON public.vins;
DROP POLICY IF EXISTS "Users can update own vins" ON public.vins;
DROP POLICY IF EXISTS "Users can delete own vins" ON public.vins;

-- INSERTION : Seuls admin et moderator peuvent créer des vins
CREATE POLICY "Admins and moderators can insert vins"
  ON public.vins FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- UPDATE : Admin peut modifier tous les vins
-- (policy "Admins can update all vins" existe déjà)

-- UPDATE : Moderators peuvent modifier leurs propres vins
CREATE POLICY "Moderators can update own vins"
  ON public.vins FOR UPDATE
  USING (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- DELETE : Admin peut supprimer tous les vins
-- (policy "Admins can delete all vins" existe déjà)

-- DELETE : Moderators peuvent supprimer leurs propres vins
CREATE POLICY "Moderators can delete own vins"
  ON public.vins FOR DELETE
  USING (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- ==================================================
-- STANDARD_ARTICLES : Restriction des permissions INSERT/UPDATE/DELETE
-- ==================================================

-- Supprimer les anciennes policies trop permissives pour les users standard
DROP POLICY IF EXISTS "All authenticated users can insert standard articles" ON public.standard_articles;
DROP POLICY IF EXISTS "Users can update own standard articles" ON public.standard_articles;
DROP POLICY IF EXISTS "Users can delete own standard articles" ON public.standard_articles;

-- INSERTION : Seuls admin et moderator peuvent créer des articles
CREATE POLICY "Admins and moderators can insert standard articles"
  ON public.standard_articles FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- UPDATE : Admin peut modifier tous les articles
-- (policy "Admins can update all standard articles" existe déjà)

-- UPDATE : Moderators peuvent modifier leurs propres articles
CREATE POLICY "Moderators can update own standard articles"
  ON public.standard_articles FOR UPDATE
  USING (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- DELETE : Admin peut supprimer tous les articles
-- (policy "Admins can delete all standard articles" existe déjà)

-- DELETE : Moderators peuvent supprimer leurs propres articles
CREATE POLICY "Moderators can delete own standard articles"
  ON public.standard_articles FOR DELETE
  USING (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'moderator'
    )
  );

-- ==================================================
-- VIN_TAGS : Restriction des permissions
-- ==================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Vin owners can manage vin tags" ON public.vin_tags;

-- Seuls admin et moderator (propriétaires) peuvent gérer les tags de vins
CREATE POLICY "Admins and moderators can manage vin tags"
  ON public.vin_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vins
      WHERE id = vin_id
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
      )
    )
  );

-- ==================================================
-- ARTICLE_TAGS : Restriction des permissions
-- ==================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Article owners can manage article tags" ON public.article_tags;

-- Seuls admin et moderator (propriétaires) peuvent gérer les tags d'articles
CREATE POLICY "Admins and moderators can manage article tags"
  ON public.article_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_articles
      WHERE id = article_id
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
      )
    )
  );

-- ==================================================
-- STANDARD_ARTICLE_PHOTOS : Restriction des permissions
-- ==================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Article owners can manage photos" ON public.standard_article_photos;

-- Seuls admin et moderator (propriétaires) peuvent gérer les photos
CREATE POLICY "Admins and moderators can manage article photos"
  ON public.standard_article_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_articles
      WHERE id = article_id
      AND created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
      )
    )
  );

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
