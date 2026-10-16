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
- contact.html                -> Contact
- partenariat.html            -> Bouton Partenariat
- images/                     -> photos fournies par le client

Chaque page contient son CSS intégré dans <style> et son JavaScript intégré dans <script>.
La partie statique ne nécessite pas de compilation. L'API d'actualités nécessite Cloudflare Pages, une base D1 et un bucket R2.

IMPORTANT:
1. Pour consulter uniquement les pages statiques, ouvrir index.html dans un navigateur.
2. Les photos fournies ont été intégrées dans images/.
3. Les coordonnées (téléphone/email) sont celles affichées par le portail officiel consulté le 06/10/2026.
4. Les chiffres/projets publics utilisés dans les pages doivent être revérifiés et validés par la mairie avant mise en production.
5. Les formulaires de contact et partenariat sont des démonstrations: ils doivent être connectés à un backend/API ou à la messagerie officielle.
6. Le bouton "Guide de l'investisseur" est prêt mais attend le PDF officiel.
7. Les actualités envoyées depuis actualites.html sont publiées immédiatement et visibles par tous les visiteurs. Toute personne peut publier; configurez une protection anti-spam/règle de limitation de requêtes Cloudflare avant de diffuser le formulaire publiquement.

MISE EN SERVICE DU STOCKAGE PARTAGÉ DES ACTUALITÉS (Cloudflare Pages)
====================================================================

Le formulaire envoie le titre et le sous-titre vers une API Pages Function. Les textes sont conservés dans D1, et les images et fichiers MP3 dans un bucket R2. Un MP3 est facultatif, limité à 15 Mo et peut être lu ou téléchargé depuis chaque actualité. Le navigateur ne stocke plus les nouvelles publications en local. Les titres sont limités à 20 000 caractères et les sous-titres à 100 000 caractères (bien au-delà de 255 mots); les images JPG, PNG, WebP et GIF sont limitées à 5 Mo.

1. Déployer le dossier "site 3" comme racine du projet Cloudflare Pages. La commande de build peut rester vide et le dossier de sortie est ".". Le répertoire "functions" doit rester à la racine du projet pour que Cloudflare détecte les routes API.
2. Dans un terminal ouvert dans "site 3", créer les ressources Cloudflare:
   npx wrangler d1 create abengourou-actualites
   npx wrangler r2 bucket create abengourou-actualites-images
   Noter l'identifiant D1 affiché par la première commande.
3. Créer la table dans la base distante:
   npx wrangler d1 execute abengourou-actualites --remote --file=schema.sql
   Si la table actualites existe déjà, ajouter la colonne audio une seule fois:
   npx wrangler d1 execute abengourou-actualites --remote --file=migration_audio.sql
   Ne pas appliquer cette migration après schema.sql sur une base nouvellement créée: audio_key y est déjà présente.
4. Dans Cloudflare Dashboard, ouvrir le projet Pages, puis Settings > Functions > Bindings. Ajouter les liaisons pour les environnements Production et Preview:
   - D1 database binding: variable name NEWS_DB, sélectionner abengourou-actualites.
   - R2 bucket binding: variable name NEWS_IMAGES, sélectionner abengourou-actualites-images.
5. Redéployer le projet Pages. Vérifier /api/actualites sur le domaine du site: la réponse attendue avant toute publication est {"news":[]}.

Ouvrir le fichier HTML directement avec file:// permet de consulter la page, mais pas d'utiliser l'API. Le formulaire partagé fonctionne sur le domaine Cloudflare Pages une fois les liaisons configurées. Les anciens éléments enregistrés uniquement dans le localStorage d'un navigateur ne sont pas transférés automatiquement vers la base partagée.

SOURCES DE CONTENU UTILISÉES POUR LA VERSION DE TRAVAIL:
- Portail officiel Commune d'Abengourou: mairieabengourou.ci
- AIP: projets communaux 2026 et infrastructures sanitaires/scolaires
- Portail économique ivoirien: profil régional et données RGPH 2021
- DGBF: lignes de concours financiers 2026

Les textes et chiffres ne constituent pas une validation institutionnelle.
