# Mise en service des droits RGPD

## Déjà effectué

- La migration SQL de protection des données a été exécutée dans Supabase.
- La fonction `delete-account` a été déployée et la CLI a lié le dossier local au projet.
- La région affichée dans Supabase pour la base de données est Paris (`eu-west-3`).

## À confirmer avant un usage réel avec des étudiants

1. Obtenir de l’établissement son accord écrit et faire déterminer au responsable de traitement/DPO, s’il y en a un, les rôles, la base légale, l’information des élèves et parents, et si une analyse d’impact est nécessaire. Ne pas activer les comptes d’élèves avant cette validation.
2. Renseigner l’identité et le contact effectif du responsable dans `src/pages/PrivacyPolicy.tsx`. La politique doit aussi nommer le DPO lorsqu’il y en a un, donner les bases légales validées, définir les durées de conservation et fournir un contact réel pour exercer les droits.
3. Tant que ces validations ne sont pas faites, garder les nouvelles inscriptions désactivées dans **Supabase Dashboard → Authentication → Settings**. Le formulaire Atlas masque aussi l’inscription par défaut ; ne définir `VITE_STUDENT_ACCOUNTS_ENABLED=true` dans Vercel qu’après validation. Le réglage Supabase est nécessaire car un appel direct à l’API pourrait contourner l’interface du site.
4. Dans Supabase, confirmer les réglages de région Auth et base, du fournisseur SMTP, des confirmations d’e-mail, des URL de retour et des règles de mot de passe. Vérifier les politiques RLS et privilèges sur chaque table exposée via l’API, y compris `countries`, `quizzes`, `quiz_attempts`, `quiz_country_progress`, `quiz_review_items` et `fr_departements`. La région de base Paris ne prouve pas celle des autres traitements.
5. Dans Vercel et chez chaque fournisseur, relever les fonctions activées (dont Analytics), les lieux de traitement, les transferts hors EEE, accords de sous-traitance, journaux, sauvegardes et durées d’effacement. Le site charge actuellement des cartes et drapeaux depuis des CDN tiers ; leurs requêtes transmettent des données techniques comme l’adresse IP et le navigateur.
6. La comparaison des scores est maintenant masquée dans la fonction SQL si le groupe contient moins de six comptes, ainsi que pour les quiz personnalisés. Appliquer le fichier `migrations/20260930000002_hide_small_cohort_comparisons.sql` dans le SQL Editor Supabase avant de déployer la version du site qui gère les valeurs masquées.
7. Vérifier le parcours de suppression/export et définir une suppression des comptes inactifs. Confirmer aussi quelles tables applicatives sont réellement présentes dans le projet de production.

Atlas ne contient pas d’outil d’analyse d’audience ou de publicité dans le code inspecté. Cela ne confirme pas les réglages Vercel. L’authentification garde une session dans le stockage local du navigateur. La politique explique ces éléments et reste explicitement marquée comme incomplète tant que les points ci-dessus ne sont pas confirmés.
