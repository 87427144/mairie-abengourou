PORTAIL DE LA COMMUNE D'ABENGOUROU
====================================

Fichiers:
- index.html                  -> Accueil
- la-ville.html               -> La ville
- actions.html                -> Nos actions
- projets.html                -> Nos projets
- investir.html               -> Investir
- culture-tourisme.html       -> Culture & Tourisme
- actualites.html             -> Actualités
- functions/api/actualites.js -> API publique des actualités (Cloudflare Pages Functions)
- functions/api/actualites/image/[id].js -> Affichage des images depuis R2
- functions/api/actualites/audio/[id].js -> Lecture et téléchargement des MP3 depuis R2
- schema.sql                  -> Schéma de la base D1
- migration_audio.sql         -> Migration D1 pour ajouter le stockage audio
- wrangler.jsonc              -> Configuration Pages et liaisons D1/R2
- prepare-pages.ps1           -> Prépare le dossier de déploiement sans l'image inutilisée de 37 Mo
- contact.html                -> Contact
- partenariat.html            -> Bouton Partenariat
- images/                     -> photos fournies par le client

Chaque page contient son CSS intégré dans <style> et son JavaScript intégré dans <script>.
La partie statique ne nécessite pas de compilation. Le site est publié sur Cloudflare Pages avec une API d'actualités utilisant D1 et R2.

IMPORTANT:
1. Site publié: https://abengourou-mairie.pages.dev/
2. Pour consulter uniquement les pages statiques localement, ouvrir index.html dans un navigateur.
3. Les photos fournies ont été intégrées dans images/.
4. Les coordonnées (téléphone/email) sont celles affichées par le portail officiel consulté le 06/10/2026.
5. Les chiffres/projets publics utilisés dans les pages doivent être revérifiés et validés par la mairie.
6. Les formulaires de contact et partenariat sont des démonstrations: ils doivent être connectés à un backend/API ou à la messagerie officielle.
7. Le bouton "Guide de l'investisseur" est prêt mais attend le PDF officiel.
8. Les actualités envoyées depuis actualites.html sont publiées immédiatement et visibles par tous les visiteurs. Toute personne peut publier; configurez une protection anti-spam/règle de limitation de requêtes Cloudflare.

MISE EN SERVICE DU STOCKAGE PARTAGÉ DES ACTUALITÉS (Cloudflare Pages)
====================================================================

Le formulaire envoie le titre et le sous-titre vers une API Pages Function. Les textes sont conservés dans D1, et les images et fichiers MP3 dans un bucket R2. Un MP3 est facultatif, limité à 15 Mo et peut être lu ou téléchargé depuis chaque actualité. Le navigateur ne stocke plus les nouvelles publications en local. Les titres sont limités à 20 000 caractères et les sous-titres à 100 000 caractères (bien au-delà de 255 mots); les images JPG, PNG, WebP et GIF sont limitées à 5 Mo.

1. Le projet Cloudflare Pages "abengourou-mairie" est créé et publié. Sa configuration et ses liaisons D1/R2 se trouvent dans wrangler.jsonc. Depuis le dossier "site 3", préparer le dossier statique et republier avec:
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\prepare-pages.ps1
   npx wrangler pages deploy .\dist --project-name=abengourou-mairie --branch=main
   Le répertoire "functions" et wrangler.jsonc doivent rester à la racine du projet pour que Wrangler détecte les routes API et applique les liaisons. Le script conserve les originaux et exclut "images/branding 1.jpg", image non référencée de 37 Mo (la limite Pages est de 25 Mo par fichier).
2. Les ressources Cloudflare de ce site sont déjà créées:
   - D1: abengourou-actualites (ID: 4e1ed449-c985-499f-8e9b-16bc594ee595)
   - R2: abengourou-actualites-images
   - Le schéma distant contient déjà la table actualites, y compris audio_key. Ne pas recréer ces ressources et ne pas exécuter migration_audio.sql sur cette base.
   Pour une nouvelle installation, créer une base D1 et un bucket R2 avec Wrangler, mettre à jour leurs identifiants/noms dans wrangler.jsonc, puis appliquer schema.sql à la base distante.
3. La configuration Wrangler applique les liaisons D1 et R2 au déploiement. Pour vérifier que l'API fonctionne, ouvrir https://abengourou-mairie.pages.dev/api/actualites; la réponse attendue avant toute publication est {"news":[]}.

Ouvrir le fichier HTML directement avec file:// permet de consulter la page, mais pas d'utiliser l'API. Le formulaire partagé fonctionne sur le domaine Cloudflare Pages. Les anciennes actualités qui étaient enregistrées uniquement dans le localStorage d'un navigateur ne sont pas transférées vers la base partagée.

SOURCES DE CONTENU UTILISÉES POUR LA VERSION DE TRAVAIL:
- Portail officiel Commune d'Abengourou: mairieabengourou.ci
- AIP: projets communaux 2026 et infrastructures sanitaires/scolaires
- Portail économique ivoirien: profil régional et données RGPH 2021
- DGBF: lignes de concours financiers 2026

Les textes et chiffres ne constituent pas une validation institutionnelle.
