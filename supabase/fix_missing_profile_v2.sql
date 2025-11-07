-- Script de correction V2 : Créer le profil en contournant les politiques RLS
-- À exécuter dans Supabase SQL Editor

-- Désactiver temporairement RLS pour permettre l'insertion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Créer le profil pour tous les utilisateurs sans profil
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  u.id,
  u.email,
  'admin' as role,
  NULL as full_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Vérification : afficher tous les profils créés
SELECT id, email, role, created_at FROM public.profiles;
