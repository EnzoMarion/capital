# Mise en service des droits RGPD

Avant de présenter la politique comme définitive ou d’annoncer l’effacement automatique des comptes :

1. Appliquer `20260930000000_gdpr_user_data_policies.sql` dans le projet Supabase. La migration protège les quiz et la progression si ces tables existent, et rend les données géographiques françaises lisibles sans connexion. Si `quiz_country_progress` est créé après la migration, réappliquer le SQL après sa création.
2. Déployer la fonction de suppression :

   ```powershell
   supabase link --project-ref <référence-du-projet>
   supabase functions deploy delete-account
   ```

   La fonction vérifie le JWT, efface les quiz, scores et progressions de l’utilisateur, puis supprime son compte Auth. La clé `SUPABASE_SERVICE_ROLE_KEY` doit rester dans les secrets Supabase et ne jamais être ajoutée aux variables `VITE_*` ni au dépôt.
3. Dans `src/pages/PrivacyPolicy.tsx`, remplacer les mentions d’identité et de contact à compléter. Confirmer les régions Supabase/Vercel, les contrats de sous-traitance, les transferts hors EEE et les délais de conservation des journaux et sauvegardes.
4. Vérifier dans Supabase que la confirmation d’adresse e-mail, les URL de réinitialisation et les règles de mot de passe correspondent au domaine de production, et que RLS est activé sur chaque table contenant des données de compte.

Atlas n’intègre pas d’outil d’analyse d’audience ou de publicité. L’authentification garde une session dans le stockage local du navigateur. Des demandes vers des CDN de cartes et de drapeaux sont encore faites au chargement de ces ressources et sont décrites dans la politique.
