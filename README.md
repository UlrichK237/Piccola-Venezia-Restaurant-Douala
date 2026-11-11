# Piccola Venezia - Douala

Site web vitrine, commande en ligne et réservation de table pour le restaurant italien **Piccola Venezia** situé à Douala, Cameroun (Bonapriso).

---

## 1. Présentation

Ce projet fournit une interface moderne, responsive et optimisée pour mobile (mobile-first), permettant aux clients de :
- Consulter le menu complet et les spécialités italiennes avec photos d'illustration.
- Composer un panier et préparer une commande à transmettre directement sur WhatsApp ou par téléphone.
- Effectuer une demande de réservation de table avec créneaux horaires dynamiques adaptés au fuseau horaire de Douala (`Africa/Douala`, UTC+1).
- Consulter les informations pratiques (adresse, plan d'accès, horaires d'ouverture et contact).

---

## 2. Prérequis

- **Node.js** 20.x ou version supérieure
- **npm** (inclus avec Node.js)

---

## 3. Installation

Clonez le projet puis installez les dépendances avec le gestionnaire de paquets npm :

```bash
npm ci
```

---

## 4. Scripts disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Démarre le serveur de développement local sur `http://localhost:3000` |
| `npm run build` | Compile l'application pour la production dans le dossier `dist/` |
| `npm run preview` | Prévisualise la version de production locale |
| `npm run lint` | Vérifie les types TypeScript (`tsc --noEmit`) |
| `npm run verif` | Lance le script de conformité et sécurité (`scripts/verif-securite.mjs`) |
| `npm test` | Exécute la suite de tests unitaires (`scripts/test-securite.mjs`) |
| `node scripts/fetch-photos.mjs` | Télécharge ou met à jour les photos d'illustration depuis Wikimedia Commons |
| `node scripts/check-photos.mjs` | Vérifie l'intégrité du catalogue et des fichiers d'illustration |

---

## 5. Configuration

### Variable d'environnement WhatsApp
Créez un fichier `.env` à la racine du projet (en vous basant sur `.env.example`) :

```env
# Numéro WhatsApp du restaurant (format international sans espace ni '+', ex : 2376XXXXXXXX)
VITE_WHATSAPP_NUMBER=2376XXXXXXXX
```

*Remarque : si `VITE_WHATSAPP_NUMBER` n'est pas défini ou invalide, l'application désactive automatiquement la redirection WhatsApp et invite le client à appeler directement le restaurant ou à copier le message préparé.*

### Fichiers de configuration et données
- **`src/config.ts`** :
  - Paramètres de réservation : nombre minimum/maximum de personnes par table, liste des occasions proposées.
  - Conditions commerciales et frais de livraison en FCFA.
  - Fonction de formatage des montants monétaires en FCFA.
- **`src/data/restaurantData.ts`** :
  - Coordonnées de l'établissement (nom, adresse, téléphone, horaires d'ouverture, coordonnées GPS).
  - Catalogue complet du menu (catégories, plats, descriptions, prix en FCFA, notes et options).
- **`src/data/corrections.json`** :
  - Dictionnaire de corrections orthographiques automatiques appliquées dynamiquement à l'affichage et aux messages de commande/réservation.

---

## 6. Déploiement

### Déploiement sur Vercel
1. Importez le dépôt Git dans votre tableau de bord Vercel.
2. Vercel détecte automatiquement le projet Vite.
3. Configurez la variable d'environnement `VITE_WHATSAPP_NUMBER` dans les paramètres du projet (*Settings > Environment Variables*).
4. Le fichier `vercel.json` inclus applique automatiquement la politique de sécurité (Content-Security-Policy, X-Frame-Options, etc.) et empêche l'indexation SEO des domaines de prévisualisation temporaires `*.vercel.app` via l'en-tête `X-Robots-Tag: noindex, nofollow`.

### Déploiement sur Cloudflare Pages ou Netlify
- **Commande de build** : `npm run build`
- **Dossier de sortie (Output directory)** : `dist`
- Les règles de sécurité sont automatiquement lues depuis `public/_headers`.

---

## 7. Checklist « Avant la mise en ligne »

- [ ] Définir la variable `VITE_WHATSAPP_NUMBER` dans l'environnement de production avec le vrai numéro WhatsApp de réception.
- [ ] Vérifier les tarifs, descriptions et disponibilités dans `src/data/restaurantData.ts`.
- [ ] Exécuter la suite complète de contrôle :
  ```bash
  npm run lint
  npm run build
  npm run verif
  npm test
  ```
- [ ] Tester une réservation de table et vérifier les créneaux horaires affichés.
- [ ] Tester une commande complète avec panier, options et transmission du message.
