# PaperVault

Archive reçus / factures / garanties. 2 onglets : Archive, Photos.

## Setup (déjà fait)

- **Supabase** : URL + clé dans `src/config.ts`. Tables créées (SQL). Il reste à faire :
  - **Storage** → New bucket **`receipts`** (Public).
  - Optionnel : **Edge Functions** → **parse-receipt** + secret `OPENAI_API_KEY` pour le pré-remplissage IA.

## Dev

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Settings → Pages → Source : **GitHub Actions**. Push sur `main` = déploiement auto.

Site : `https://<username>.github.io/PaperVault/`
