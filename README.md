# 🍷 Inventaire Cave à Vin - MVP

Application de gestion d'inventaire de cave à vin avec photos depuis tablette.

## ✅ Stack technique

- **Frontend** : Next.js 15 + React + TypeScript
- **Styling** : Tailwind CSS
- **Backend** : Supabase (BDD PostgreSQL + Storage)
- **Déploiement** : Netlify

---

## 🚀 Lancer le projet en LOCAL

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Vérifiez que le fichier `.env.local` existe avec vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_supabase
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrez http://localhost:3000 dans votre navigateur.

---

## 📦 Déployer sur NETLIFY

### Option 1 : Via l'interface Netlify (recommandé)

1. **Pousser le code sur GitHub** :
   ```bash
   git add .
   git commit -m "Initial commit - MVP cave à vin"
   git push origin main
   ```

2. **Connecter à Netlify** :
   - Allez sur https://app.netlify.com
   - Cliquez sur "Add new site" > "Import an existing project"
   - Choisissez "Deploy with GitHub"
   - Sélectionnez votre repo `inventaire-cave`

3. **Configuration du build** :
   - **Build command** : `npm run build`
   - **Publish directory** : `.next`
   - **Framework preset** : Next.js

4. **Variables d'environnement** :
   - Cliquez sur "Site settings" > "Environment variables"
   - Ajoutez :
     - `NEXT_PUBLIC_SUPABASE_URL` = votre URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé

5. **Déployer** :
   - Cliquez sur "Deploy site"
   - Attendez 2-3 minutes
   - Votre site est en ligne ! 🎉

### Option 2 : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Déployer
netlify deploy --prod
```

---

## 📱 Utiliser sur tablette

1. Ouvrez l'URL de votre site sur votre tablette
2. Le bouton "📷 Ajouter des photos" ouvrira directement la caméra
3. Prenez vos photos, elles seront automatiquement uploadées

---

## 🗄️ Structure base de données

Tables créées dans Supabase :
- `vins` : Informations sur les vins
- `photos` : Photos des vins (stockées dans Supabase Storage)
- `bouteilles` : Instances physiques individuelles

---

## 🔧 Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Lancer en production localement
npm start

# Linter
npm run lint
```

---

## 📋 Fonctionnalités MVP

✅ **Gestion des vins** :
- Créer un vin avec toutes ses infos
- Lister tous les vins
- Voir la fiche détaillée d'un vin

✅ **Photos** :
- Upload depuis tablette (caméra native)
- Carrousel avec navigation
- Commentaires par photo

✅ **Bouteilles** :
- Ajouter des bouteilles individuelles
- États qualitatifs (Excellent, Bon, etc.)
- Niveaux de remplissage (Plein, Haut épaule, etc.)
- Statistiques automatiques

---

## 🚧 À venir dans les prochaines versions

- Multi-utilisateurs avec permissions
- Tags (canaux de vente)
- Articles génériques (meubles, objets)
- Système de commissaire-priseur
- Filtres avancés
- Export PDF

---

## 🐛 Debugging

### Le site ne se lance pas ?
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur Supabase ?
- Vérifiez que les clés dans `.env.local` sont correctes
- Vérifiez que les tables sont créées (via SQL Editor)
- Vérifiez que le bucket `photos-vins` existe et est Public

### Les photos ne s'uploadent pas ?
- Vérifiez que le bucket est bien en mode Public
- Vérifiez les policies RLS (voir script SQL)

---

## 📞 Support

Pour toute question, vérifiez :
1. Console du navigateur (F12)
2. Logs Netlify (onglet "Deploys")
3. Logs Supabase (onglet "Logs")

---

**Développé en 1 nuit avec Claude AI** 🤖🍷
