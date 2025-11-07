# Guide d'application des migrations SQL

## Option 1 : Via l'interface Supabase (Recommandé pour débutants)

### Étapes détaillées avec captures d'écran

1. **Accédez à Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```
   - Connectez-vous avec vos identifiants

2. **Sélectionnez votre projet**
   - Dans la liste des projets, cliquez sur votre projet
   - URL : `kqgdkrgyoyfqhwyfzkor.supabase.co`

3. **Ouvrez le SQL Editor**
   - Menu de gauche → Cliquez sur l'icône `<>` (SQL Editor)
   - Ou cherchez "SQL Editor" dans la barre de recherche

4. **Appliquer la première migration**

   a. Cliquez sur **"+ New query"** (bouton en haut à droite)

   b. Ouvrez le fichier local :
      ```
      C:\Users\victo\inventaire-studio-VS\inventaire-cave\supabase\migrations\20250106_create_auth_and_permissions.sql
      ```

   c. Sélectionnez TOUT le contenu (Ctrl+A)

   d. Copiez (Ctrl+C)

   e. Retournez dans Supabase SQL Editor

   f. Collez le contenu (Ctrl+V)

   g. Cliquez sur **"Run"** (bouton vert en haut à droite) ou appuyez sur Ctrl+Enter

   h. Attendez l'exécution (peut prendre 5-10 secondes)

   i. Vérifiez le résultat :
      - ✅ Message "Success" en vert = Tout va bien !
      - ❌ Message d'erreur en rouge = Lisez l'erreur et contactez-moi

5. **Appliquer la deuxième migration**

   a. Cliquez à nouveau sur **"+ New query"**

   b. Ouvrez le fichier local :
      ```
      C:\Users\victo\inventaire-studio-VS\inventaire-cave\supabase\migrations\20250106_seed_initial_data.sql
      ```

   c. Copiez tout le contenu

   d. Collez dans le SQL Editor

   e. Cliquez sur **"Run"**

   f. Vérifiez le succès

6. **Vérification finale**

   a. Dans le menu de gauche, cliquez sur **"Table Editor"**

   b. Vous devriez voir ces nouvelles tables :
      - ✅ profiles
      - ✅ sales_channels
      - ✅ user_channels
      - ✅ tags
      - ✅ standard_articles
      - ✅ standard_article_photos
      - ✅ article_tags
      - ✅ vin_tags

   c. Cliquez sur la table `sales_channels`

   d. Vous devriez voir 4 lignes :
      - Hôtel de vente
      - Le Bon Coin
      - iDealwine
      - Autre

## Option 2 : Via la CLI Supabase (Pour utilisateurs avancés)

### Prérequis
- Node.js installé
- NPM ou autre gestionnaire de paquets

### Installation de la CLI

```bash
npm install -g supabase
```

### Étapes

1. **Se connecter à Supabase**
   ```bash
   supabase login
   ```
   - Une page web s'ouvrira pour vous authentifier
   - Autorisez l'accès

2. **Lier votre projet local**
   ```bash
   cd C:\Users\victo\inventaire-studio-VS\inventaire-cave
   supabase link --project-ref kqgdkrgyoyfqhwyfzkor
   ```
   - Entrez votre mot de passe de base de données si demandé

3. **Appliquer les migrations**
   ```bash
   supabase db push
   ```
   - Cette commande applique automatiquement toutes les migrations du dossier `supabase/migrations`

4. **Vérifier**
   ```bash
   supabase db reset --linked
   ```

## Problèmes courants

### Erreur : "relation already exists"
**Cause** : Les tables existent déjà
**Solution** :
- Soit vous avez déjà appliqué les migrations (vérifiez dans Table Editor)
- Soit supprimez les tables existantes avant de réessayer

### Erreur : "permission denied"
**Cause** : Vous n'avez pas les droits d'admin sur le projet Supabase
**Solution** : Vérifiez que vous êtes bien connecté avec le bon compte

### Erreur : "syntax error"
**Cause** : Le fichier SQL n'a pas été copié entièrement
**Solution** :
- Assurez-vous de copier TOUT le contenu du fichier
- Vérifiez qu'il n'y a pas de caractères bizarres

### Les tables apparaissent mais sont vides
**Cause** : Vous avez oublié d'appliquer la deuxième migration (seed_initial_data.sql)
**Solution** : Appliquez le fichier `20250106_seed_initial_data.sql`

## Après avoir appliqué les migrations

### Prochaine étape : Créer votre compte admin

1. Démarrez l'application :
   ```bash
   npm run dev
   ```

2. Ouvrez http://localhost:3000

3. Vous serez redirigé vers `/login`

4. Cliquez sur "Créer un compte"

5. Remplissez :
   - Email : votre-email@example.com
   - Mot de passe : minimum 6 caractères

6. Cliquez sur "Créer un compte"

7. Message de succès apparaît

8. Cliquez sur "Se connecter"

9. Entrez vos identifiants

10. **Important** : Par défaut vous êtes "Standard", il faut vous promouvoir en Admin :

    **Option A** : Via Supabase Dashboard
    - Allez dans Table Editor → profiles
    - Trouvez votre ligne (votre email)
    - Double-cliquez sur la colonne `role`
    - Changez `standard` en `admin`
    - Appuyez sur Entrée

    **Option B** : Via SQL Editor
    ```sql
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = 'votre-email@example.com';
    ```

11. Déconnectez-vous et reconnectez-vous

12. Vous devriez voir le badge "Admin" en rouge dans la navbar

13. Vous avez maintenant accès à tous les onglets !

## Besoin d'aide ?

Si vous rencontrez un problème :
1. Copiez le message d'erreur complet
2. Prenez une capture d'écran si possible
3. Notez à quelle étape vous êtes bloqué
4. Contactez-moi avec ces informations
