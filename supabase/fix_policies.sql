-- Correction des politiques RLS pour éviter la récursion infinie
-- Le problème : les politiques admin consultent profiles, ce qui crée une boucle

-- 1. Supprimer toutes les anciennes politiques sur profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- 2. Créer des politiques simplifiées SANS récursion

-- Tout utilisateur authentifié peut voir son propre profil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Tout utilisateur authentifié peut voir TOUS les profils (pour simplifier)
-- L'accès aux données sensibles sera contrôlé au niveau applicatif
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seuls les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Pour l'insertion, on permet à tout utilisateur authentifié
-- (normalement fait par le trigger)
CREATE POLICY "Authenticated users can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Vérification
SELECT 'NOUVELLES POLITIQUES' as info, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';
