-- Script de correction : Créer le profil manquant pour l'utilisateur connecté
-- À exécuter dans Supabase SQL Editor

-- Cette requête va créer automatiquement un profil admin pour tous les utilisateurs
-- qui n'en ont pas encore (typiquement le premier utilisateur créé)

INSERT INTO public.profiles (id, email, role, full_name)
SELECT
  u.id,
  u.email,
  'admin' as role,  -- Premier utilisateur = admin automatiquement
  NULL as full_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
LIMIT 1;  -- Seulement le premier utilisateur sans profil

-- Vérification : afficher tous les profils créés
SELECT id, email, role, created_at FROM public.profiles;
