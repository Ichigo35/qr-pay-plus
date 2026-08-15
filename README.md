# QR Pay Plus

Application mobile de génération de QR de paiement au Laos

1. Objectif du projet

Je veux créer une application mobile native iOS et Android, destinée au marché laotien, permettant à un utilisateur de transformer un QR bancaire existant en QR de paiement avec montant prérempli.

L'idée principale :

L'utilisateur importe ou photographie un QR bancaire existant.

L'application détecte et décode les informations contenues dans ce QR.

L'utilisateur saisit le montant qu'il souhaite faire payer.

L'application génère un nouveau QR contenant les informations du bénéficiaire + le montant.

Le client final scanne ce nouveau QR avec son application bancaire.

Le client n'a donc plus besoin de saisir manuellement le montant.

L'application doit fonctionner aussi bien pour :

particuliers ;

commerçants ;

restaurants ;

magasins ;

indépendants ;

associations ;

petites entreprises.

L'objectif est de supporter autant que possible les QR de paiement utilisés au Laos, quelle que soit la banque émettrice du QR.

2. Plateformes

IMPORTANT :

Cette application est MOBILE ONLY.

Elle doit être conçue exclusivement pour :

Android

iOS

Utiliser une architecture compatible avec Capacitor afin de permettre la génération des applications Android et iOS.

Il n'y a PAS de produit web à développer.

Ne pas créer :

landing page web ;

dashboard web ;

version desktop ;

site SaaS ;

interface administrateur web.

Le projet peut techniquement utiliser une architecture web interne nécessaire à Capacitor, mais l'expérience utilisateur et toutes les fonctionnalités doivent être pensées exclusivement pour une application mobile.

3. Principe de fonctionnement

Étape 1 — Ajouter un QR

L'utilisateur arrive sur l'écran principal.

Afficher un bouton :

"Ajouter un QR bancaire"

Deux possibilités :

Prendre une photo

Choisir une image dans la galerie

L'application doit détecter automatiquement le QR dans l'image.

Utiliser une bibliothèque fiable de lecture QR compatible mobile.

Si aucun QR n'est détecté :

Afficher :

"QR code introuvable. Veuillez prendre une photo plus nette ou sélectionner une autre image."

4. Décodage du QR

Après détection, récupérer le contenu brut du QR.

Afficher ensuite un écran de vérification.

Exemple :

QR détecté

Bénéficiaire :
XXXX XXXX

Banque :
BCEL

Informations QR :
XXXXXX

Puis demander à l'utilisateur :

"Ces informations sont-elles correctes ?"

Boutons :

Confirmer

Recommencer

IMPORTANT :

Ne jamais supposer qu'un QR appartient à une banque simplement à partir de son apparence visuelle.

L'application doit analyser le contenu réel du QR.

5. Support multi-banques

L'architecture doit être conçue pour supporter plusieurs formats de QR bancaires.

Créer une architecture de type :

QR Decoder
↓
QR Format Detection
↓
Bank / Payment Scheme Detection
↓
Payload Parser
↓
Amount Injection
↓
Checksum / CRC recalculation
↓
QR Generator

Créer un système modulaire permettant d'ajouter facilement de nouvelles banques ou nouveaux formats ultérieurement.

Exemple conceptuel :

BankAdapter

detect()

parse()

validate()

injectAmount()

rebuild()

generate()

Ne pas coder toute la logique dans un seul fichier.

6. Très important : ne pas inventer les standards

L'application ne doit PAS supposer qu'il suffit de modifier une chaîne de caractères dans n'importe quel QR.

Le système doit :

décoder le QR ;

identifier son format ;

parser ses champs ;

identifier le champ montant lorsqu'il existe ;

créer/modifier le montant uniquement si le format le permet ;

recalculer correctement les éventuels CRC/checksum ;

reconstruire le payload ;

générer le nouveau QR ;

vérifier que le QR généré peut être décodé correctement.

Si le format du QR n'est pas compatible avec la modification du montant :

Afficher clairement :

"Ce QR n'est pas compatible avec la génération d'un montant prérempli."

Ne jamais générer un QR potentiellement invalide.

7. Écran principal

Créer une interface mobile moderne, simple et très rapide.

Écran :

QR PAY LAOS

Sous-titre :

"Générez un QR de paiement avec montant prérempli."

Bouton principal :

+ Ajouter un QR bancaire

Section :

Mes QR enregistrés

Afficher les QR récemment utilisés.

Chaque élément doit afficher :

nom du bénéficiaire ;

banque si détectée ;

date ;

bouton "Payer".

Ajouter également :

Historique

8. Création d'un paiement

Après avoir sélectionné un QR bancaire :

Afficher :

Nouveau paiement

Bénéficiaire :
[ Nom ]

Banque :
[ Banque ]

Montant

[ 0 ₭ ]

Utiliser un clavier numérique mobile.

Le montant doit être exprimé en LAK / ₭.

Ajouter éventuellement des boutons rapides :

10 000 ₭

20 000 ₭

50 000 ₭

100 000 ₭

Bouton principal :

Générer le QR

9. Écran QR généré

Après génération :

Afficher un grand QR au centre de l'écran.

Au-dessus :

Montant à payer

50 000 ₭

Puis :

Bénéficiaire :
XXXX

Banque :
BCEL

Ajouter les boutons :

Afficher le QR

Partager

Enregistrer

Nouveau montant

Le QR doit être suffisamment grand et contrasté pour être facilement scanné par un téléphone placé devant l'écran.

10. Partage

Le bouton "Partager" doit utiliser le système natif iOS/Android.

L'utilisateur doit pouvoir partager :

l'image du QR ;

éventuellement le QR accompagné du montant et du bénéficiaire.

Utiliser les capacités natives de partage via Capacitor.

11. Sauvegarde des QR

L'utilisateur doit pouvoir enregistrer un bénéficiaire.

Exemple :

"Ma boutique"

QR bancaire associé.

Lors d'une prochaine utilisation :

Accueil
→ Ma boutique
→ saisir montant
→ générer QR

Ne pas obliger l'utilisateur à importer à nouveau son QR.

12. Gestion des favoris

Permettre :

ajouter un QR aux favoris ;

modifier son nom ;

supprimer un QR ;

générer directement un nouveau QR avec ce bénéficiaire.

Exemple :

⭐ Restaurant Jimmy
⭐ Ma boutique
⭐ Appartement
⭐ Café

13. Historique

Créer un historique local des QR générés.

Chaque entrée :

date ;

heure ;

bénéficiaire ;

banque ;

montant ;

QR utilisé.

Permettre de sélectionner une ancienne entrée et de :

"Générer à nouveau"

avec possibilité de modifier le montant.

14. Confidentialité

IMPORTANT.

Les informations bancaires contenues dans les QR doivent être traitées avec un maximum de confidentialité.

Pour le MVP :

traitement du QR localement sur le téléphone autant que possible ;

ne pas envoyer automatiquement les QR bancaires vers un serveur ;

ne pas stocker les informations bancaires dans une base distante sans nécessité ;

stockage local sécurisé ;

aucune donnée bancaire personnelle dans les logs.

L'application ne doit pas collecter inutilement :

numéro de compte ;

nom du bénéficiaire ;

contenu brut des QR ;

historique des paiements.

Prévoir une architecture permettant d'ajouter ultérieurement un backend uniquement si nécessaire.

15. Aucun paiement intégré

IMPORTANT :

L'application ne réalise PAS elle-même le paiement.

Elle génère uniquement le QR.

Le fonctionnement est :

Utilisateur A
↓
Application QR
↓
QR avec montant
↓
Utilisateur B scanne le QR avec son application bancaire
↓
Application bancaire
↓
Paiement

L'application ne doit donc pas intégrer :

Stripe ;

carte bancaire ;

portefeuille électronique ;

transfert bancaire ;

compte bancaire utilisateur.

16. Validation du QR généré

C'est une fonctionnalité critique.

Après génération du QR :

décoder immédiatement le QR généré ;

vérifier que le payload correspond au QR attendu ;

vérifier que le montant correspond exactement au montant demandé ;

vérifier les éventuels CRC/checksum ;

seulement ensuite afficher le QR comme valide.

Si la validation échoue :

"Impossible de générer un QR de paiement valide."

Ne jamais afficher un QR comme valide si sa structure n'a pas été vérifiée.

17. Gestion des montants

Le montant doit être strictement positif.

Exemples :

1 000 ₭
5 000 ₭
25 000 ₭
100 000 ₭
1 500 000 ₭

Empêcher :

0 ₭ ;

montant négatif ;

caractères non numériques ;

montant dépassant la limite autorisée par le format du QR.

Formatter automatiquement les milliers.

Exemple :

100000 → 100 000 ₭

18. UX mobile

L'interface doit être conçue pour être extrêmement simple.

L'utilisateur cible peut être un commerçant qui utilise l'application plusieurs dizaines de fois par jour.

Objectif :

QR enregistré → montant → QR généré

en quelques secondes.

Éviter les écrans inutiles.

Navigation mobile :

Accueil
│
├── Mes QR
│
├── Historique
│
└── Paramètres

19. Design

Créer un design moderne inspiré des applications fintech.

Style :

propre ;

professionnel ;

minimaliste ;

très lisible ;

boutons larges ;

excellent contraste ;

compatible mode clair et mode sombre.

Utiliser une identité visuelle adaptée au Laos.

Devise :

₭ LAK

Langues prévues :

Lao

Français

Anglais

Préparer l'architecture pour l'internationalisation dès le départ.

20. Onboarding

Au premier lancement :

Écran 1 :

Payez plus rapidement avec les QR

"Importez votre QR bancaire et générez instantanément un QR avec montant prérempli."

Écran 2 :

Ajoutez votre QR

"Prenez une photo ou sélectionnez une image."

Écran 3 :

Entrez le montant

"Votre client n'aura plus besoin de saisir le montant."

Bouton :

Commencer

21. Permissions

Demander uniquement les permissions nécessaires.

Caméra :
uniquement lorsque l'utilisateur choisit de scanner/prendre une photo.

Photos :
uniquement lorsque l'utilisateur choisit une image.

Notifications :
ne pas demander au lancement sauf si une fonctionnalité future le nécessite.

22. Architecture technique

Créer une architecture propre et maintenable.

Séparer :

/qr
/qr-scanner
/qr-parser
/qr-generator
/bank-adapters
/payment
/storage
/history
/settings
/i18n

Créer des interfaces/types clairement définis.

Exemple conceptuel :

QRData

rawPayload

format

bank

merchantName

merchantId

currency

amount

additionalData

PaymentQR

originalQR

amount

generatedPayload

generatedQRCode

validationStatus

23. Base de données

Pour le MVP, privilégier le stockage local.

Les QR enregistrés doivent pouvoir être stockés localement sur l'appareil.

Ne pas créer de backend inutile.

Si une base locale est nécessaire, utiliser une solution adaptée à iOS/Android via Capacitor.

Prévoir cependant une architecture permettant l'ajout futur d'un backend.

24. Sécurité

Ne jamais faire confiance aux données provenant directement d'un QR.

Valider :

longueur ;

caractères ;

structure ;

champs ;

montant ;

checksum ;

format.

Protéger les données stockées localement.

Ne jamais mettre de secrets ou clés API directement dans le frontend.

25. Gestion des QR inconnus

Si l'utilisateur importe un QR qui n'est pas un QR de paiement compatible :

Afficher :

QR détecté mais format de paiement non reconnu.

Puis :

"Ce QR peut être un QR d'un autre service ou un format qui n'est actuellement pas pris en charge."

Bouton :

Essayer un autre QR

26. Mode démonstration / développement

Créer quelques QR de test fictifs permettant de tester l'interface sans utiliser de véritables données bancaires.

Ajouter éventuellement un environnement :

DEMO MODE

pour tester :

import ;

parsing ;

montant ;

génération ;

validation ;

historique.

Ne jamais utiliser de véritables informations bancaires dans les données de démonstration.

27. Tests

Créer des tests automatisés pour :

QR valide ;

QR invalide ;

QR inconnu ;

montant valide ;

montant nul ;

montant négatif ;

montant très élevé ;

parsing ;

génération ;

recalcul CRC ;

décodage du QR généré ;

comparaison du montant original et du montant généré.

Test critique :

Input QR
+
Amount = 50 000 LAK
↓
Generated QR
↓
Decode Generated QR
↓
Amount must equal 50 000 LAK

28. Important concernant les banques du Laos

Ne prétends PAS supporter une banque ou un standard si le format n'a pas été techniquement vérifié.

Créer l'architecture permettant d'ajouter progressivement les banques et standards.

Prévoir une liste configurable :

BCEL

JDB

LaoVietBank

LDB

APB

Indochina Bank

BIC

autres banques / réseaux QR du Laos

Mais ne pas coder de faux algorithmes spécifiques à ces banques simplement parce que leur nom apparaît dans cette liste.

La compatibilité réelle devra être déterminée à partir des formats QR effectivement utilisés.

29. MVP

Le MVP doit se concentrer sur le workflow essentiel :

1.

Importer/scanner un QR.

2.

Décoder le QR.

3.

Identifier si le format est compatible.

4.

Saisir le montant.

5.

Générer le QR avec montant.

6.

Valider le QR généré.

7.

Afficher le QR.

8.

Partager le QR.

9.

Sauvegarder le bénéficiaire localement.

Ne pas ajouter de fonctionnalités sociales, marketplace, paiement en ligne ou compte utilisateur dans le MVP.

30. Très important pour le développement

Avant d'implémenter définitivement la logique de génération, identifier précisément les standards de QR de paiement utilisés au Laos.

Ne pas supposer que tous les QR bancaires laotiens utilisent exactement le même format.

Le code doit être conçu pour permettre :

QR Standard A
→ Parser A
→ Generator A

QR Standard B
→ Parser B
→ Generator B

QR Standard C
→ Parser C
→ Generator C

Si un QR ne peut pas être modifié de manière fiable :

→ le refuser proprement.

La priorité absolue est :

VALIDITÉ DU QR > nombre de banques supportées.

31. Livrable attendu de Lovable

Construire une première version complète de l'application mobile avec :

UI mobile ;

navigation ;

scanner QR ;

import image ;

parser architecture ;

génération QR ;

saisie montant ;

validation ;

sauvegarde locale ;

historique ;

partage natif ;

multilingue ;

dark mode ;

architecture Capacitor ;

code propre et modulaire ;

tests.

Ne pas construire de site web public.

Ne pas créer de dashboard web.

Ne pas ajouter de paiement intégré.

L'objectif est d'obtenir une application iOS + Android extrêmement simple permettant à un commerçant ou particulier au Laos de prendre son QR bancaire existant, saisir un montant et présenter immédiatement un QR de paiement avec ce montant déjà intégré.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/34309985-4a2e-41d7-a6f5-c8c5619a1a5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
