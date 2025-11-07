-- Créer la table des catégories pour les articles standards
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- RLS Policies pour categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les catégories
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO public
  USING (true);

-- Seuls les admins peuvent créer des catégories
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent modifier des catégories
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des catégories
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Modifier la table standard_articles pour utiliser une foreign key vers categories
-- D'abord, sauvegarder les catégories existantes
DO $$
BEGIN
  -- Insérer les catégories existantes uniques dans la nouvelle table
  INSERT INTO public.categories (name, created_at)
  SELECT DISTINCT categorie, NOW()
  FROM public.standard_articles
  WHERE categorie IS NOT NULL AND categorie != ''
  ON CONFLICT (name) DO NOTHING;
END $$;

-- Ajouter une nouvelle colonne category_id
ALTER TABLE public.standard_articles
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Migrer les données : associer les category_id basés sur les noms
UPDATE public.standard_articles sa
SET category_id = c.id
FROM public.categories c
WHERE sa.categorie = c.name AND sa.categorie IS NOT NULL;

-- On garde l'ancienne colonne 'categorie' pour compatibilité ascendante
-- Elle sera supprimée plus tard si tout fonctionne bien
-- ALTER TABLE public.standard_articles DROP COLUMN IF EXISTS categorie;
