# Supabase – à faire après le SQL

Tu as déjà exécuté le SQL (tables). Il reste :

## 1. Bucket pour les photos

**Storage** → **New bucket** → nom : **`receipts`** → coche **Public** → Create.

## 2. (Optionnel) Parsing IA

**Edge Functions** → **Create** → nom **`parse-receipt`** → coller le code de `supabase/functions/parse-receipt/index.ts` → ajouter le secret **`OPENAI_API_KEY`** (ta clé OpenAI).

Sans ça, le scan enregistre les images mais ne pré-remplit pas les champs.
