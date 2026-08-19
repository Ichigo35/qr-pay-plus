# QR Pay Plus — guide pour Claude Code

Application mobile (Capacitor, iOS/Android) qui transforme un QR bancaire existant
en QR de paiement avec montant prérempli, pour le marché laotien. Voir `README.md`
pour la spec produit complète.

> **MOBILE ONLY.** Pas de produit web séparé, pas de landing page, pas d'interface
> admin web. Le "tableau de bord" décrit plus bas est un écran *dans* l'app mobile
> (même gabarit que `/history`, `/qrs`, `/settings`), pas un dashboard web.

## Stack

- TanStack Start (React 19) + TanStack Router en **file-based routing** :
  chaque fichier `.tsx` dans `src/routes/` devient une route. `src/routeTree.gen.ts`
  est auto-généré par le plugin router au build/dev — ne jamais l'éditer à la main
  (voir `src/routes/README.md` pour les conventions de nommage).
- Capacitor (Preferences, Camera, Filesystem, Share, Status Bar) pour le build mobile.
- Tailwind v4 + shadcn/ui (`src/components/ui/*`). Le style des écrans n'utilise pas
  le composant `Card` shadcn : le pattern courant est `rounded-2xl bg-card p-4 shadow-card`
  directement en JSX (garder ce pattern pour rester cohérent visuellement).
- `bun` comme gestionnaire de paquets/scripts (`bun run dev`, `bun run build:dev`, `bun run lint`).

## Stockage local (pas de backend)

- `src/lib/storage/local-store.ts` — wrapper JSON au-dessus de `@capacitor/preferences`
  (Keychain/SharedPreferences). Tout est **local au téléphone**, aucune donnée
  bancaire n'est envoyée à un serveur (voir clé i18n `privacyDesc`).
- `src/lib/storage/models.ts` — types `SavedQR` (QR bancaire enregistré),
  `HistoryEntry` (chaque paiement/QR généré, avec `savedQrId`, `amount`, `createdAt`),
  `AppSettings`.
- `src/lib/storage/repository.ts` — CRUD sur ces modèles (`getSavedQRs`, `saveQR`,
  `getHistory`, `addHistory`, `getSettings`, `saveSettings`, …).
- L'historique (`addHistory`) est alimenté depuis `src/routes/qr.$id.tsx` à chaque
  génération de QR de paiement validée.

## i18n

- `src/lib/i18n/translations.ts` — dictionnaires `fr` / `en` / `lo`. `fr` est la
  base ; `en` et `lo` font `...fr` puis surchargent les clés traduites (donc une
  clé oubliée retombe silencieusement en français, jamais en anglais).
- Accès via `useT()` (hook `t(key)`) et `useApp()` pour `settings.language` / `lang`.

## Fonctionnalité : tableau de bord (`/dashboard`)

Ajouté pour lister l'historique des paiements/QR générés, triable par mois et par
QR code utilisé, avec les montants totaux (par mois filtré et par QR).
- Fichier : `src/routes/dashboard.tsx`. Réutilise `getHistory()` — aucun nouveau
  champ de stockage n'a été nécessaire (`HistoryEntry` avait déjà `savedQrId`,
  `amount`, `createdAt`, `bank`, `name`).
- Point d'entrée : bouton dans le header de `/history` (icône `LayoutDashboard`).
- Pas encore dans la nav bar du bas (`MobileShell`) volontairement, pour ne pas
  präjuger de son statut premium (voir section abonnements ci-dessous).

## Abonnements prévus (à ne PAS implémenter maintenant — prévision future)

L'utilisateur réfléchit encore au détail, mais l'intention actuelle notée est :

- Système d'abonnement à **plusieurs paliers**.
- Palier de base : **1 seul QR bancaire** enregistrable.
- Palier premium (nom pas encore choisi) : **plusieurs QR bancaires** (> 1).
- Le **tableau de bord** (`/dashboard`) est un candidat pressenti pour devenir une
  fonctionnalité réservée aux paliers payants.
- Rien de tout cela n'est câblé pour l'instant : pas de logique de paywall, pas de
  limite sur `saveQR`, pas de champ `plan`/`tier` dans `AppSettings`. Quand
  l'utilisateur aura arrêté les paliers, prévoir probablement :
  - un champ genre `AppSettings.plan` (ou une table dédiée si backend un jour),
  - une vérification de quota dans `saveQR()` (`src/lib/storage/repository.ts`)
    basée sur `getSavedQRs().length`,
  - un gate d'accès sur la route `/dashboard`.
