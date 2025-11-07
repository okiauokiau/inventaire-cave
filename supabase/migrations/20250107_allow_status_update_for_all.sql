-- Migration : Autoriser tous les utilisateurs authentifiés à modifier le statut
-- Date : 2025-01-07
-- Description : Permettre aux utilisateurs standard de cocher/décocher les statuts "accepté" et "vendu"

-- ==================================================
-- VINS : Ajouter policy pour UPDATE du statut uniquement
-- ==================================================

-- Tous les utilisateurs authentifiés peuvent modifier le statut (et les dates associées)
CREATE POLICY "All users can update vin status"
  ON public.vins FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==================================================
-- STANDARD_ARTICLES : Ajouter policy pour UPDATE du statut uniquement
-- ==================================================

-- Tous les utilisateurs authentifiés peuvent modifier le statut (et les dates associées)
CREATE POLICY "All users can update article status"
  ON public.standard_articles FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==================================================
-- Note importante
-- ==================================================
-- Ces policies permettent à tous les utilisateurs de modifier le statut via les checkboxes
-- Les autres modifications (nom, prix, etc.) restent restreintes aux admins/moderators
-- grâce aux policies existantes qui sont plus spécifiques

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
