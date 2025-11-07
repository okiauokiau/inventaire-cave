-- Migration : Ajouter les politiques de stockage pour les photos d'articles
-- Date : 2025-01-07
-- Description : Permettre aux utilisateurs authentifiés d'uploader, lire et supprimer des photos d'articles

-- ==================================================
-- STORAGE : Créer le bucket pour les articles s'il n'existe pas
-- ==================================================

-- Insérer le bucket s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-photos',
  'article-photos',
  true,  -- public pour permettre l'affichage des images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- STORAGE POLICIES : Lecture publique
-- ==================================================

-- Politique de lecture publique pour toutes les photos d'articles
CREATE POLICY "Public read access for article photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-photos');

-- ==================================================
-- STORAGE POLICIES : Upload pour utilisateurs authentifiés
-- ==================================================

-- Tous les utilisateurs authentifiés peuvent uploader des photos
CREATE POLICY "Authenticated users can upload article photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-photos');

-- ==================================================
-- STORAGE POLICIES : Mise à jour pour utilisateurs authentifiés
-- ==================================================

-- Tous les utilisateurs authentifiés peuvent mettre à jour leurs propres photos
CREATE POLICY "Authenticated users can update article photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'article-photos')
WITH CHECK (bucket_id = 'article-photos');

-- ==================================================
-- STORAGE POLICIES : Suppression pour utilisateurs authentifiés
-- ==================================================

-- Tous les utilisateurs authentifiés peuvent supprimer des photos
CREATE POLICY "Authenticated users can delete article photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-photos');

-- ==================================================
-- Note importante
-- ==================================================
-- Ces politiques permettent à tous les utilisateurs authentifiés de :
-- - Uploader des photos d'articles
-- - Lire toutes les photos (public)
-- - Mettre à jour des photos
-- - Supprimer des photos
--
-- Les permissions de modification/suppression d'articles restent contrôlées
-- au niveau de la table standard_articles via les policies existantes

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
