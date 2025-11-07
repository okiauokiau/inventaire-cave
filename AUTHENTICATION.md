# Système d'authentification et de permissions

## État d'avancement

### ✅ Terminé

1. **Base de données**
   - Schéma SQL complet créé (`supabase/migrations/20250106_create_auth_and_permissions.sql`)
   - 9 tables créées avec toutes les relations
   - Politiques RLS (Row Level Security) configurées pour chaque table
   - Trigger automatique pour créer un profil lors de l'inscription
   - Données initiales (canaux de vente) créées

2. **Authentification**
   - Page de connexion/inscription (`/login`)
   - Context React pour gérer l'état d'authentification (`lib/auth-context.tsx`)
   - Composant de protection des routes (`components/protected-route.tsx`)
   - Intégration avec Supabase Auth

3. **Navigation**
   - Navbar avec affichage du rôle utilisateur
   - Onglets visibles selon les permissions
   - Bouton de déconnexion

4. **Pages**
   - Tableau de bord d'accueil avec statistiques
   - Page liste des vins protégée
   - Page de connexion/inscription

### ⏳ À faire

1. **Pages manquantes**
   - `/articles` : Liste des articles standards
   - `/articles/nouveau` : Formulaire de création d'article
   - `/articles/[id]` : Détail d'un article
   - `/comptes` : Gestion des utilisateurs (admin)
   - `/tags` : Gestion des tags (admin/moderator)

2. **Appliquer les migrations**
   - Se connecter à Supabase Dashboard
   - Exécuter les migrations SQL

3. **Créer le premier admin**
   - S'inscrire via l'interface
   - Promouvoir le compte en admin via SQL

## Architecture des rôles

### Admin
- Accès complet à toutes les fonctionnalités
- Peut gérer les comptes utilisateurs
- Peut gérer les canaux de vente
- Peut modifier/supprimer tous les vins et articles

### Moderator
- Peut consulter tous les vins et articles
- Peut créer des vins, articles et tags
- Peut modifier ses propres créations uniquement
- Accès à l'onglet "Tags"

### Standard
- Peut consulter tous les vins et articles
- Peut créer des vins et articles
- Peut modifier/supprimer ses propres créations uniquement
- Ne peut pas créer de tags

## Comment démarrer

### 1. Appliquer les migrations Supabase

Rendez-vous sur https://supabase.com/dashboard et :

1. Ouvrez le **SQL Editor**
2. Copiez-collez le contenu de `supabase/migrations/20250106_create_auth_and_permissions.sql`
3. Exécutez la requête
4. Copiez-collez le contenu de `supabase/migrations/20250106_seed_initial_data.sql`
5. Exécutez la requête

### 2. Créer le premier admin

1. Démarrez l'application : `npm run dev`
2. Allez sur http://localhost:3000
3. Vous serez redirigé vers `/login`
4. Cliquez sur "Créer un compte"
5. Remplissez le formulaire et créez votre compte

**Important** : Par défaut, les nouveaux comptes ont le rôle "standard". Pour promouvoir votre compte en admin :

6. Allez dans Supabase Dashboard → **Table Editor** → `profiles`
7. Trouvez votre compte et changez `role` de `standard` à `admin`

Ou via SQL :
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'votre-email@example.com';
```

### 3. Tester l'authentification

1. Déconnectez-vous
2. Reconnectez-vous
3. Vous devriez voir le badge "Admin" dans la navbar
4. Vous devriez avoir accès à tous les onglets

## Navigation

### Onglets disponibles par rôle

| Onglet | Admin | Moderator | Standard |
|--------|-------|-----------|----------|
| Accueil | ✅ | ✅ | ✅ |
| Vins | ✅ | ✅ | ✅ |
| Articles | ✅ | ✅ | ✅ |
| Comptes | ✅ | ❌ | ❌ |
| Tags | ✅ | ✅ | ❌ |

## Statuts des articles/vins

Chaque article ou vin peut avoir un des statuts suivants :

- **en_vente** : En vente (par défaut)
- **accepte** : Accepté par l'hôtel de vente
- **vendu** : Vendu
- **archive** : Archivé

## Canaux de vente par défaut

- Hôtel de vente
- Le Bon Coin
- iDealwine
- Autre

## Fichiers créés

```
├── supabase/
│   ├── migrations/
│   │   ├── 20250106_create_auth_and_permissions.sql
│   │   └── 20250106_seed_initial_data.sql
│   └── README.md
├── lib/
│   ├── auth-context.tsx (Context d'authentification)
│   └── supabase.ts (Client Supabase existant)
├── components/
│   ├── protected-route.tsx (Protection des routes)
│   └── navbar.tsx (Navigation avec permissions)
├── app/
│   ├── page.tsx (Tableau de bord)
│   ├── login/
│   │   └── page.tsx (Page de connexion/inscription)
│   └── vins/
│       └── page.tsx (Liste des vins protégée)
└── AUTHENTICATION.md (Ce fichier)
```

## Sécurité

- Toutes les routes (sauf `/login`) sont protégées par authentification
- Les politiques RLS empêchent l'accès non autorisé aux données
- Les utilisateurs ne peuvent modifier que leurs propres créations (sauf admin)
- Les mots de passe doivent faire au moins 6 caractères

## Prochaines étapes

1. Appliquer les migrations SQL
2. Créer le premier compte admin
3. Créer les pages manquantes (Articles, Comptes, Tags)
4. Ajouter les filtres par statut et canal
5. Implémenter l'upload de photos pour les articles standards
