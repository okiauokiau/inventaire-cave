# 🍷 Inventaire Cave à Vin - MVP

Application de gestion d'inventaire de cave à vin avec photos depuis tablette.

## ✅ Stack technique

- **Frontend** : Next.js 15.1.9 + React 19 + TypeScript
- **Styling** : Tailwind CSS v4
- **Backend** : Supabase (BDD PostgreSQL + Storage)
- **Déploiement** : Vercel (gratuit)

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

## 📦 Déployer sur VERCEL

### Via l'interface Vercel (recommandé)

1. **Pousser le code sur GitHub** :
   ```bash
   git add .
   git commit -m "Initial commit - MVP cave à vin"
   git push origin main
   ```

2. **Connecter à Vercel** :
   - Allez sur https://vercel.com
   - Connectez-vous avec GitHub
   - Cliquez sur "Add New..." > "Project"
   - Sélectionnez votre repo `inventaire-cave`
   - Vercel détecte automatiquement Next.js

3. **Variables d'environnement** :
   - Déroulez la section "Environment Variables"
   - Ajoutez :
     - `NEXT_PUBLIC_SUPABASE_URL` = votre URL Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre clé anon (publique)
     - `SUPABASE_SERVICE_ROLE_KEY` = votre clé service_role (secrète)

4. **Déployer** :
   - Cliquez sur "Deploy"
   - Attendez 1-2 minutes
   - Votre site est en ligne ! 🎉

### Déploiements automatiques

Après la configuration initiale, chaque `git push` sur la branche `main` déclenche automatiquement un nouveau déploiement sur Vercel.

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
2. Logs Vercel (onglet "Deployments" > cliquez sur un déploiement > "Logs")
3. Logs Supabase (onglet "Logs")

---

## 🌐 URL de production

- **Application** : https://inventaire-cave.vercel.app (ou votre domaine personnalisé)
- **Supabase** : https://kqgdkrgyoyfqhwyfzkor.supabase.co

---

**Développé avec Claude AI** 🤖🍷
