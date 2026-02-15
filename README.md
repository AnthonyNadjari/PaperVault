# PaperVault

Archive personnelle minimaliste pour reçus, factures et garanties. Interface premium, iPhone-first, 2 onglets (Archive / Photos).

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

1. **Activer GitHub Pages** : dans le dépôt, **Settings** → **Pages** → **Source** : **GitHub Actions**.
2. À chaque push sur `main`, le workflow `.github/workflows/deploy.yml` build et déploie l’app.
3. L’app est disponible à : `https://<ton-username>.github.io/PaperVault/`

## Utilisation

- **Archive** : liste chronologique, recherche (marchand, montant, commentaire, etc.), bouton « + Scan ».
- **Scan** : prise de photo(s), import bibliothèque ou glisser-déposer → extraction OCR + parsing IA → enregistrement.
- **Détail** : carousel d’images, champs éditables (type, marchand, date, montant, catégorie, commentaire, garantie, lignes).
- **Photos** : galerie visuelle par date, clic → détail du document.
