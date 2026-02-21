# Comment fonctionne le traitement des images dans PaperVault

Ce document décrit en détail le flux complet des images : de la prise de photo jusqu’à l’affichage dans l’app (Archive, Photos, détail document). Il sert de référence pour débugger, faire évoluer la fonctionnalité ou expliquer le système à une IA.

---

## 1. Vue d’ensemble

- **Stockage** : Supabase Storage, bucket **privé** nommé `receipts`. Aucune URL publique.
- **Base de données** : table `documents`, colonne `image_urls` (type `text[]`). On ne stocke **pas** d’URL complète, uniquement le **chemin** dans le bucket (ex. `uuid-doc/0.jpg`).
- **Affichage** : à partir du chemin, on génère une **URL signée** (temporaire) Supabase et on l’utilise directement dans `<img src="...">`. Aucun `fetch`, aucun blob, aucun `createObjectURL`.

---

## 2. Upload (Scan)

**Fichier** : `src/lib/upload.ts`

**Flux** :

1. L’utilisateur sélectionne une ou plusieurs images (appareil photo, galerie ou glisser-déposer). Les fichiers sont des `File` (natif).
2. Pour chaque fichier, on appelle `uploadReceiptImage(docId, file, index)` :
   - **Compression** : `browser-image-compression` réduit la taille (max 1200px, qualité 0.85) et convertit en JPEG. Résultat : un `File` de type `image/jpeg`.
   - **Clé de stockage** : `{docId}/{index}.jpg` (ex. `a1b2c3d4-e5f6-7890-abcd-ef1234567890/0.jpg`). Toujours `.jpg` pour cohérence et type MIME correct.
   - **Upload** : `supabase.storage.from('receipts').upload(key, compressedFile, { contentType: 'image/jpeg' })`. Le bucket `receipts` doit exister et les policies RLS doivent autoriser `INSERT` pour le rôle `anon` (et éventuellement `authenticated`).
   - **Retour** : la fonction retourne la **clé** (string), pas une URL. Ex. `a1b2c3d4.../0.jpg`.
3. Ces clés sont regroupées dans un tableau `imageUrls` et enregistrées dans le document : `insertDocument({ ..., image_urls: imageUrls })`. En base, `image_urls` contient donc uniquement des chemins relatifs dans le bucket.

**Points importants** :

- Le bucket est **privé** : on n’utilise jamais `getPublicUrl`. Seules les URLs signées permettent la lecture.
- Si le bucket n’existe pas ou si la policy d’upload est manquante, l’upload échoue (erreur « bucket not found » ou « new row violates row level security policy »). Il faut exécuter les migrations SQL (notamment `002_fix_rls.sql`) et créer le bucket `receipts` dans le dashboard Supabase.

---

## 3. Récupération de l’URL d’affichage (signed URL)

**Fichier** : `src/lib/storage.ts`

**Fonction** : `getSignedUrl(pathOrUrl, expiresIn?)`

**Comportement** :

1. **Entrée** :
   - `pathOrUrl` : soit un **chemin** dans le bucket (ex. `uuid/0.jpg`), soit une **URL complète** (ex. anciennes URLs publiques si migration).
   - `expiresIn` : durée de validité en secondes (défaut : 24 h).

2. **Traitement** :
   - Si `pathOrUrl` est vide ou invalide → retourne `null`.
   - Si `pathOrUrl` commence par `http://` ou `https://` → retourné tel quel (rétrocompatibilité).
   - Sinon, c’est un chemin : on enlève un éventuel slash en tête, puis on appelle `supabase.storage.from('receipts').createSignedUrl(path, expiresIn)`.

3. **Sortie** :
   - En cas de succès : l’URL signée (string), utilisable telle quelle dans `<img src="...">`.
   - En cas d’erreur (bucket absent, path incorrect, RLS qui refuse) : `null` (et erreur loguée en console).

**Important** : une signed URL Supabase a la forme `https://xxx.supabase.co/storage/v1/object/sign/receipts/path/to/file.jpg?token=...`. Elle est temporaire et authentifiée par le token. Aucun besoin de faire un `fetch()` côté client : le navigateur charge l’image directement quand il rencontre `<img src={signedUrl}>`. Faire un `fetch` + `blob` + `createObjectURL` était source de bugs (CORS, double requête, expiration, icône « image cassée »).

---

## 4. Affichage dans l’UI (StorageImage)

**Fichier** : `src/components/StorageImage.tsx`

**Props** :

- `pathOrUrl` : string ou undefined (un élément de `doc.image_urls[]`, ou undefined si pas d’image).
- `alt`, `className`, `loading` : classiques pour une image.
- `expiresIn` : optionnel, durée de validité de la signed URL (défaut 24 h).

**Comportement** :

1. Si `pathOrUrl` est vide ou invalide → on affiche un bloc gris (placeholder), pas d’appel réseau.
2. Sinon, dans un `useEffect` :
   - On appelle `getSignedUrl(pathOrUrl, expiresIn)`.
   - Si le résultat est une string, on la met dans un state `url`.
   - On gère le démontage (flag `isMounted`) pour ne pas mettre à jour le state après unmount.
3. **Rendu** :
   - Tant qu’on n’a pas encore d’URL → placeholder en « pulse » (gris, `animate-pulse`).
   - Dès qu’on a une URL → `<img src={url} alt={alt} className={...} loading={...} />`.
   - Si l’image échoue au chargement (`onError`) → on repasse en placeholder (state `loadError`) pour éviter l’icône « image cassée » du navigateur.

**Utilisation** :

- **Archive** : vignette du premier document → `<StorageImage pathOrUrl={doc.image_urls[0]} className="h-full w-full object-cover" />`.
- **Photos** : grille → même chose pour `doc.image_urls[0]` avec `loading="lazy"`.
- **DocumentDetail** : carousel → pour chaque `doc.image_urls[i]`, un `<StorageImage pathOrUrl={...} className="h-full w-full object-contain" />`.

Aucun autre composant ne doit afficher une image de reçu sans passer par `StorageImage` (pour centraliser la logique signed URL + placeholder + erreur).

---

## 5. Supabase : bucket et RLS

- **Bucket** : nom exact `receipts`, **privé** (pas de case « Public »). Créé dans Storage du dashboard.
- **Policies sur `storage.objects`** (obligatoires pour que signed URL + lecture fonctionnent) :
  - **SELECT** : pour que la génération de signed URL et le chargement par le navigateur réussissent. Ex. policy « Allow anon read receipts » : `FOR SELECT TO anon, authenticated USING (bucket_id = 'receipts');`
  - **INSERT** : pour l’upload au scan. Ex. `FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'receipts');`
  - Éventuellement UPDATE/DELETE si tu veux permettre suppression/remplacement des fichiers.

Sans policy SELECT sur `receipts`, `createSignedUrl` peut réussir mais le chargement de l’URL par le navigateur renverra 403 et l’image ne s’affichera pas (ou déclenchera `onError`).

---

## 6. Déploiement (GitHub Pages, Vite)

- **Base** : `base: '/PaperVault/'` dans `vite.config.ts` pour que les assets de l’app soient servis sous `https://username.github.io/PaperVault/`.
- Les **URLs signées** pointent vers le domaine Supabase (`*.supabase.co`), pas vers GitHub Pages. Donc `base` n’affecte pas les images ; seul le bon fonctionnement de Supabase (bucket + RLS + CORS si besoin) compte.
- Aucune variable d’environnement côté build pour les images : l’URL et la clé Supabase sont dans `src/config.ts` (hardcodées). Le bucket et les policies sont côté Supabase.

---

## 7. Résumé du flux

1. **Scan** : fichier → compression JPEG → upload vers `receipts/{docId}/{index}.jpg` → enregistrement du **chemin** dans `documents.image_urls`.
2. **Affichage** : lecture de `doc.image_urls[i]` (chemin) → `getSignedUrl(path)` → signed URL → `<img src={signedUrl}>`. Pas de fetch, pas de blob, pas d’object URL.
3. **Erreur** : si pas de path, si `getSignedUrl` retourne null, ou si l’image échoue au load → placeholder (gris / pulse) pour ne jamais afficher l’icône « image cassée ».

Ce flux garantit que les images s’affichent correctement (liste, grille, détail) tant que le bucket existe, les policies RLS sont correctes et la config Supabase (URL + clé) est valide dans `config.ts`.
