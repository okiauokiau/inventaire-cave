-- Migration : Correction des restrictions par canal de vente
-- Date : 2025-01-07
-- Description : Restreindre l'accès aux vins et articles selon les canaux assignés

-- ==================================================
-- VINS : Correction des policies SELECT
-- ==================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "All authenticated users can view vins" ON public.vins;

-- Admin peut voir tous les vins
CREATE POLICY "Admins can view all vins"
  ON public.vins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent voir leurs propres vins
CREATE POLICY "Users can view own vins"
  ON public.vins FOR SELECT
  USING (created_by = auth.uid());

-- Utilisateurs peuvent voir les vins des canaux qui leur sont assignés
CREATE POLICY "Users can view vins from assigned channels"
  ON public.vins FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id
      FROM public.user_channels
      WHERE user_id = auth.uid()
    )
  );

-- Utilisateurs peuvent voir les vins sans canal assigné
CREATE POLICY "Users can view vins without channel"
  ON public.vins FOR SELECT
  USING (channel_id IS NULL);

-- ==================================================
-- STANDARD_ARTICLES : Correction des policies SELECT
-- ==================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "All authenticated users can view standard articles" ON public.standard_articles;

-- Admin peut voir tous les articles
CREATE POLICY "Admins can view all standard articles"
  ON public.standard_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Créateurs peuvent voir leurs propres articles
CREATE POLICY "Users can view own standard articles"
  ON public.standard_articles FOR SELECT
  USING (created_by = auth.uid());

-- Utilisateurs peuvent voir les articles des canaux qui leur sont assignés
CREATE POLICY "Users can view standard articles from assigned channels"
  ON public.standard_articles FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id
      FROM public.user_channels
      WHERE user_id = auth.uid()
    )
  );

-- Utilisateurs peuvent voir les articles sans canal assigné
CREATE POLICY "Users can view standard articles without channel"
  ON public.standard_articles FOR SELECT
  USING (channel_id IS NULL);

-- ==================================================
-- FIN DE LA MIGRATION
-- ==================================================
