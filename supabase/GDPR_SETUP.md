# Mise en service des droits RGPD

## Déjà effectué

- La migration SQL de protection des données a été exécutée dans Supabase.
- La fonction `delete-account` a été déployée et la CLI a lié le dossier local au projet.
- La région affichée dans Supabase pour la base de données est Paris (`eu-west-3`).

## À confirmer avant un usage réel avec des étudiants

1. Dans `src/pages/PrivacyPolicy.tsx`, renseigner l’identité et le contact public du responsable. Si Atlas est utilisé dans le cadre d’un établissement, clarifier avec lui qui est responsable du traitement et qui répond aux demandes des étudiants ; faire valider l’information par son DPO s’il en a un.
2. Confirmer auprès de Vercel les régions de traitement, les accords de sous-traitance et la durée de conservation des journaux. Vérifier si Vercel Analytics ou un autre outil est activé, et mettre la politique à jour si nécessaire. Confirmer aussi les transferts hors EEE et délais de conservation des sauvegardes/journaux Supabase et des CDN.
3. Vérifier dans Supabase que la confirmation d’adresse e-mail, le fournisseur SMTP, les URL de réinitialisation et les règles de mot de passe correspondent au domaine de production. Contrôler les tables personnelles non listées par la migration et activer une politique RLS adaptée à chacune. Déterminer avec l’établissement si le public inclut des mineurs et quelles règles s’appliquent avant d’ouvrir les inscriptions.

Atlas n’intègre pas d’outil d’analyse d’audience ou de publicité. L’authentification garde une session dans le stockage local du navigateur. Des demandes vers des CDN de cartes et de drapeaux sont encore faites au chargement de ces ressources et sont décrites dans la politique.
