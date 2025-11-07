# Migrations Supabase - Système de gestion des droits

## Vue d'ensemble

Ce dossier contient les migrations SQL pour mettre en place le système complet de gestion des droits multi-rôles avec :
- 3 rôles utilisateur (admin, moderator, standard)
- Gestion des canaux de vente
- Articles standards (en plus des vins)
- Système de tags
- Authentification email/mot de passe
- Politiques de sécurité RLS (Row Level Security)

## Structure des migrations

### 1. `20250106_create_auth_and_permissions.sql`
Migration principale qui crée :
- Table `profiles` : Profils utilisateurs avec rôles
- Table `sales_channels` : Canaux de vente (Hôtel de vente, Le Bon Coin, etc.)
- Table `user_channels` : Assignation des utilisateurs aux canaux
- Table `tags` : Étiquettes pour catégoriser les articles et vins
- Table `standard_articles` : Articles standards (non-vins)
- Table `standard_article_photos` : Photos des articles standards
- Table `article_tags` : Liaison articles ↔ tags
- Table `vin_tags` : Liaison vins ↔ tags
- Modifications de la table `vins` : Ajout de `channel_id`, `status`, etc.
- **Toutes les politiques RLS** pour sécuriser l'accès aux données
- Trigger automatique pour créer un profil lors de l'inscription

### 2. `20250106_seed_initial_data.sql`
Données initiales :
- 4 canaux de vente par défaut

## Comment appliquer les migrations

### Option 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `20250106_create_auth_and_permissions.sql`
5. Exécutez la requête (bouton "Run")
6. Vérifiez qu'il n'y a pas d'erreurs
7. Répétez l'opération avec `20250106_seed_initial_data.sql`

### Option 2 : Via la CLI Supabase

```bash
# Installer la CLI Supabase (si pas déjà fait)
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet local
supabase link --project-ref kqgdkrgyoyfqhwyfzkor

# Appliquer les migrations
supabase db push
```

## Architecture des rôles et permissions

### Rôle : Admin
- **Permissions complètes** sur toutes les tables
- Peut créer/modifier/supprimer des comptes utilisateurs
- Peut gérer les canaux de vente
- Peut gérer les tags
- Peut modifier/supprimer TOUS les vins et articles (même ceux créés par d'autres)

### Rôle : Moderator
- Peut **consulter** tous les vins et articles
- Peut **créer** des vins, articles et tags
- Peut **modifier** ses propres créations uniquement
- **Ne peut pas** gérer les comptes utilisateurs
- **Ne peut pas** gérer les canaux de vente

### Rôle : Standard
- Peut **consulter** tous les vins et articles
- Peut **créer** des vins et articles
- Peut **modifier/supprimer** ses propres créations uniquement
- **Ne peut pas** créer de tags (seulement les utiliser)
- **Ne peut pas** gérer les comptes ou canaux

## Statuts des articles et vins

Chaque article/vin peut avoir un des statuts suivants :
- `en_vente` : En vente (statut par défaut)
- `accepte` : Accepté par l'hôtel de vente (avec `date_acceptation`)
- `vendu` : Vendu (avec `date_vente`)
- `archive` : Archivé

## Vérification post-migration

Après avoir appliqué les migrations, vérifiez que :

1. **Tables créées** :
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

2. **Politiques RLS activées** :
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

3. **Nombre de politiques par table** :
```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename;
```

## Création du premier admin

Après avoir appliqué les migrations, vous devrez manuellement promouvoir un utilisateur en admin :

1. Créez un compte via l'interface d'inscription
2. Allez dans Supabase Dashboard → Table Editor → profiles
3. Trouvez votre compte et changez `role` de `standard` à `admin`

Ou via SQL :
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'votre-email@example.com';
```

## Rollback (Annulation)

Si vous devez annuler les migrations :

```sql
-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS sales_channels_updated_at ON public.sales_channels;
DROP TRIGGER IF EXISTS standard_articles_updated_at ON public.standard_articles;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Supprimer les tables (CASCADE supprimera les dépendances)
DROP TABLE IF EXISTS public.vin_tags CASCADE;
DROP TABLE IF EXISTS public.article_tags CASCADE;
DROP TABLE IF EXISTS public.standard_article_photos CASCADE;
DROP TABLE IF EXISTS public.standard_articles CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.user_channels CASCADE;
DROP TABLE IF EXISTS public.sales_channels CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer les colonnes ajoutées à vins
ALTER TABLE public.vins
  DROP COLUMN IF EXISTS channel_id,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS date_acceptation,
  DROP COLUMN IF EXISTS date_vente;
```

## Support

En cas de problème, vérifiez :
1. Les logs d'erreur dans Supabase Dashboard
2. Que votre projet Supabase est bien actif
3. Que vous avez les permissions nécessaires
4. La version de PostgreSQL (minimum 12.x)
