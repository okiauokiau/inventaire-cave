-- Migration : Passage de channel_id unique a relation many-to-many pour les canaux de vente
-- Date : 2025-01-09
-- Description : Creation des tables de liaison pour permettre a un vin/article d avoir plusieurs canaux de vente

-- ==================================================
-- 1. TABLE VIN_CHANNELS (Liaison vins-canaux)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.vin_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin_id UUID NOT NULL REFERENCES public.vins(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vin_id, channel_id)
);

CREATE INDEX idx_vin_channels_vin ON public.vin_channels(vin_id);
CREATE INDEX idx_vin_channels_channel ON public.vin_channels(channel_id);

-- ==================================================
-- 2. TABLE ARTICLE_CHANNELS (Liaison articles standards-canaux)
-- ==================================================
CREATE TABLE IF NOT EXISTS public.article_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.standard_articles(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, channel_id)
);

CREATE INDEX idx_article_channels_article ON public.article_channels(article_id);
CREATE INDEX idx_article_channels_channel ON public.article_channels(channel_id);

-- ==================================================
-- 3. MIGRATION DES DONNEES EXISTANTES
-- ==================================================
-- Migrer les channel_id existants des vins vers la nouvelle table de liaison
INSERT INTO public.vin_channels (vin_id, channel_id)
SELECT id, channel_id
FROM public.vins
WHERE channel_id IS NOT NULL
ON CONFLICT (vin_id, channel_id) DO NOTHING;

-- Migrer les channel_id existants des articles standards vers la nouvelle table de liaison
INSERT INTO public.article_channels (article_id, channel_id)
SELECT id, channel_id
FROM public.standard_articles
WHERE channel_id IS NOT NULL
ON CONFLICT (article_id, channel_id) DO NOTHING;

-- ==================================================
-- 4. SUPPRESSION DES ANCIENNES COLONNES channel_id
-- ==================================================
-- Note: On garde temporairement les colonnes pour une transition en douceur
-- Elles peuvent etre supprimees plus tard avec:
-- ALTER TABLE public.vins DROP COLUMN IF EXISTS channel_id;
-- ALTER TABLE public.standard_articles DROP COLUMN IF EXISTS channel_id;

-- Pour l instant, on les marque comme deprecated en ajoutant un commentaire
COMMENT ON COLUMN public.vins.channel_id IS 'DEPRECATED: Utilisez la table vin_channels pour la relation many-to-many';
COMMENT ON COLUMN public.standard_articles.channel_id IS 'DEPRECATED: Utilisez la table article_channels pour la relation many-to-many';

-- ==================================================
-- 5. ROW LEVEL SECURITY (RLS) - Activation
-- ==================================================
ALTER TABLE public.vin_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_channels ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- 6. POLICIES RLS - VIN_CHANNELS
-- ==================================================

-- Tout le monde peut voir les liaisons vins-canaux
CREATE POLICY "All authenticated users can view vin channels"
  ON public.vin_channels FOR SELECT
  USING (auth.role() = 'authenticated');

-- Les createurs de vins peuvent gerer les canaux de leurs vins
CREATE POLICY "Vin owners can manage vin channels"
  ON public.vin_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vins
      WHERE id = vin_id AND created_by = auth.uid()
    )
  );

-- Admin peut gerer tous les canaux de vins
CREATE POLICY "Admins can manage all vin channels"
  ON public.vin_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 7. POLICIES RLS - ARTICLE_CHANNELS
-- ==================================================

-- Tout le monde peut voir les liaisons articles-canaux
CREATE POLICY "All authenticated users can view article channels"
  ON public.article_channels FOR SELECT
  USING (auth.role() = 'authenticated');

-- Les createurs d articles peuvent gerer les canaux de leurs articles
CREATE POLICY "Article owners can manage article channels"
  ON public.article_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.standard_articles
      WHERE id = article_id AND created_by = auth.uid()
    )
  );

-- Admin peut gerer tous les canaux d articles
CREATE POLICY "Admins can manage all article channels"
  ON public.article_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
