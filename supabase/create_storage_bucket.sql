-- Création d'un bucket de stockage pour les images d'articles
-- À exécuter dans Supabase SQL Editor

-- 1. Créer le bucket 'article-images' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Créer une politique pour permettre à tous les utilisateurs authentifiés de lire les images
CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- 3. Créer une politique pour permettre aux utilisateurs authentifiés d'uploader des images
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- 4. Créer une politique pour permettre aux utilisateurs de supprimer leurs propres images
-- Note : La vérification du créateur se fera au niveau applicatif
CREATE POLICY "Authenticated users can delete article images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');

-- Vérification
SELECT * FROM storage.buckets WHERE id = 'article-images';
