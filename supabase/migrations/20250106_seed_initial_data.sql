-- Migration : Données initiales
-- Date : 2025-01-06
-- Description : Insertion des données de base (canaux de vente par défaut)

-- ==================================================
-- INSERTION DES CANAUX DE VENTE PAR DÉFAUT
-- ==================================================

INSERT INTO public.sales_channels (name, description) VALUES
  ('Hôtel de vente', 'Vente aux enchères via un hôtel de vente'),
  ('Le Bon Coin', 'Vente en ligne via Le Bon Coin'),
  ('iDealwine', 'Vente sur la plateforme iDealwine'),
  ('Autre', 'Autre canal de vente')
ON CONFLICT (name) DO NOTHING;

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
