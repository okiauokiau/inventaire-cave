-- Migration : Ajouter les politiques RLS pour la table standard_article_photos
-- Date : 2025-01-07
-- Description : Permettre aux utilisateurs authentifiés de gérer les photos d'articles

-- ==================================================
-- Activer RLS sur la table standard_article_photos
-- ==================================================

ALTER TABLE public.standard_article_photos ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- POLICIES : Lecture pour tous les utilisateurs authentifiés
-- ==================================================

CREATE POLICY "Authenticated users can view article photos"
  ON public.standard_article_photos FOR SELECT
  TO authenticated
  USING (true);

-- ==================================================
-- POLICIES : Insertion pour admin et moderator
-- ==================================================

CREATE POLICY "Admins and moderators can insert article photos"
  ON public.standard_article_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- ==================================================
-- POLICIES : Mise à jour pour admin et moderator
-- ==================================================

CREATE POLICY "Admins and moderators can update article photos"
  ON public.standard_article_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- ==================================================
-- POLICIES : Suppression pour admin et moderator
-- ==================================================

CREATE POLICY "Admins and moderators can delete article photos"
  ON public.standard_article_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- ==================================================
-- Note importante
-- ==================================================
-- Ces politiques permettent :
-- - À tous les utilisateurs authentifiés de VOIR les photos
-- - Uniquement aux admin et moderator de créer/modifier/supprimer des photos
--
-- Cela correspond au modèle de permissions des articles eux-mêmes

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
