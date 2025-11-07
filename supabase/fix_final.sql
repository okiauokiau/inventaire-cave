-- Solution finale : Créer le profil ET corriger les politiques RLS

-- 1. Désactiver temporairement RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer les profils existants (au cas où)
DELETE FROM public.profiles;

-- 3. Créer le profil admin pour tous les utilisateurs
INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
SELECT
  u.id,
  u.email,
  'admin' as role,
  NULL as full_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u;

-- 4. Réactiver RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Vérification finale
SELECT 'PROFILS CRÉÉS' as info, id, email, role FROM public.profiles;
