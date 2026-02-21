# Supabase – à faire après le SQL

Tu as déjà exécuté le SQL (tables). Il reste :

## 0. Si tu as « new row violates row level security policy »

Dans **SQL Editor**, exécute le fichier **`supabase/migrations/002_fix_rls.sql`** (copier-coller tout le contenu → Run). Ça corrige les politiques RLS sur les tables et le storage.

## 1. Bucket pour les photos (obligatoire)

Si l’app affiche « bucket not found » au scan, c’est qu’il manque ce bucket.

**Storage** → **New bucket** → nom exact : **`receipts`** → Create.  
Tu peux le laisser **privé** : l’app utilise des URLs signées pour afficher les images.

## 2. (Optionnel) Parsing IA

**Edge Functions** → **Create** → nom **`parse-receipt`** → coller le code de `supabase/functions/parse-receipt/index.ts` → ajouter le secret **`OPENAI_API_KEY`** (ta clé OpenAI).

Sans ça, le scan enregistre les images mais ne pré-remplit pas les champs.
