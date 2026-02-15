# PaperVault

Archive personnelle minimaliste pour reçus, factures et garanties. Interface premium, iPhone-first, 2 onglets (Archive / Photos).

## Ce dont tu as besoin

- **Un compte Supabase** (déjà le tien) : rien d’autre à créer comme service.
- **Dans Supabase** : exécuter le SQL (tables), créer le bucket `receipts`, déployer la Edge Function `parse-receipt` avec une clé **OpenAI** (pour l’extraction automatique des champs).
- **Sur GitHub** : mettre la source de Pages sur **GitHub Actions**, et ajouter 2 secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) pour que l’app en ligne utilise ton projet Supabase.

Détail ci-dessous.

## Stack

- **Frontend** : Vite, React, TypeScript, Tailwind
- **Backend** : Supabase (PostgreSQL, Storage, Edge Functions)
- **OCR** : Tesseract.js (navigateur)
- **Parsing** : OpenAI via Edge Function

## Configuration Supabase

1. **Projet** : utilise ton projet Supabase existant.

2. **Variables d’environnement** (à la racine du projet) :
   ```bash
   cp .env.example .env
   ```
   Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`.

3. **Base de données** : exécute la migration dans l’éditeur SQL du Dashboard :
   - Ouvre `supabase/migrations/001_schema.sql` et exécute son contenu dans **SQL Editor**.

4. **Storage** : crée un bucket nommé `receipts` :
   - **Storage** → **New bucket** → nom : `receipts`
   - Coche **Public bucket** si tu veux des URLs directes (sinon tu devras utiliser des URLs signées côté app).

5. **Edge Function** (parsing IA) :
   - Dans le Dashboard : **Edge Functions** → **Create function** → nom : `parse-receipt`
   - Colle le code de `supabase/functions/parse-receipt/index.ts`
   - **Secrets** : ajoute `OPENAI_API_KEY` (clé API OpenAI) pour que le parsing fonctionne.

## Développement

```bash
npm install
npm run dev
```

## Build (GitHub Pages / static)

```bash
npm run build
```

Les fichiers sont générés dans `dist/`.

## Déploiement GitHub Pages

### Important : éviter l’erreur Jekyll / docs

Si tu vois une erreur du type **Jekyll**, **docs**, **style.scss** ou **pages build and deployment**, c’est que GitHub Pages n’utilise pas notre app mais le build par défaut (Jekyll).

À faire **une seule fois** :

1. Sur le dépôt GitHub : **Settings** → **Pages**.
2. Dans **Build and deployment**, section **Source** : choisir **GitHub Actions** (et non « Deploy from a branch »).
3. Enregistrer. Au prochain push sur `main`, c’est notre workflow qui build et déploie (plus Jekyll).

### Secrets pour que l’app en ligne utilise ton Supabase

**Si la page https://anthonynadjari.github.io/PaperVault/ est blanche**, c’est que les variables Supabase ne sont pas définies en production. Ajoute les 2 secrets ci‑dessous, puis relance le workflow « Deploy to GitHub Pages » (Actions → run).

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** pour chaque variable :
   - `VITE_SUPABASE_URL` : l’URL de ton projet (ex. `https://xxxxx.supabase.co`).
   - `VITE_SUPABASE_ANON_KEY` : la clé « anon public » du projet (Dashboard Supabase → **Settings** → **API**).

Sans ces secrets, le build passe mais l’app sur GitHub Pages ne pourra pas se connecter à Supabase.

### Résumé

- À chaque push sur `main`, le workflow build et déploie.
- L’app est à : `https://<ton-username>.github.io/PaperVault/`

## Utilisation

- **Archive** : liste chronologique, recherche (marchand, montant, commentaire, etc.), bouton « + Scan ».
- **Scan** : prise de photo(s), import bibliothèque ou glisser-déposer → extraction OCR + parsing IA → enregistrement.
- **Détail** : carousel d’images, champs éditables (type, marchand, date, montant, catégorie, commentaire, garantie, lignes).
- **Photos** : galerie visuelle par date, clic → détail du document.
