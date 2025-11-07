-- Script de diagnostic pour comprendre le problème

-- 1. Vérifier les utilisateurs dans auth.users
SELECT 'UTILISATEURS AUTH' as info, id, email, created_at
FROM auth.users;

-- 2. Vérifier les profils existants
SELECT 'PROFILS EXISTANTS' as info, id, email, role, created_at
FROM public.profiles;

-- 3. Vérifier si RLS est activé sur profiles
SELECT 'RLS STATUS' as info, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 4. Vérifier les politiques RLS sur profiles
SELECT 'POLITIQUES RLS' as info, policyname, cmd, qual::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 5. Trouver les utilisateurs sans profil
SELECT 'UTILISATEURS SANS PROFIL' as info, u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
