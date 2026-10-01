# Données personnelles Atlas — état actuel

Atlas est un projet personnel gratuit. Les quiz publics fonctionnent sans compte. Les comptes personnels sont ouverts dans l’interface; un enseignant peut partager le lien sans que son établissement administre les comptes. Si un établissement adopte officiellement Atlas, il faudra clarifier les rôles et les obligations avec lui avant cette utilisation.

## Mesures en place

- Les fonctions personnelles sont liées au compte et les règles RLS limitent l’accès aux données de chaque utilisateur.
- Le menu du compte permet d’exporter ses données et de supprimer le compte. Le bouton de suppression affiche déjà une confirmation irréversible (`window.confirm`).
- La politique de confidentialité indique Enzo Marion et `marionenzo26gre@gmail.com` comme responsable et contact.
- Les réponses aux quiz publics ne sont pas enregistrées dans un profil.
- La base du projet Supabase est dans la région Paris (`eu-west-3`). Auth stocke les comptes dans la base Postgres du projet.

## Configuration nécessaire dans Vercel

- Ajouter `SUPABASE_SERVICE_ROLE_KEY` dans les variables d’environnement Vercel, en production seulement si possible. Copier la clé secrète Supabase côté serveur; ne jamais la nommer `VITE_*` ni la mettre dans le code source.
- Ajouter `CRON_SECRET` dans Vercel avec une valeur aléatoire longue (au moins 32 caractères). Vercel s’en sert pour authentifier ses appels planifiés.
- Redéployer le projet en production. Le job quotidien configuré dans `vercel.json` supprime jusqu’à 50 comptes par jour qui n’ont pas ouvert de session depuis 24 mois, ainsi que leurs quiz, résultats et données de progression. Un compte qui n’a jamais ouvert de session est évalué à partir de sa date de création. Aucun avertissement par e-mail n’est envoyé.
- Vérifier ensuite **Vercel → Settings → Cron Jobs** et consulter les journaux du job pour confirmer ses exécutions.

## Limites restantes à connaître

- Le SMTP intégré de Supabase n’est pas adapté aux inscriptions publiques : il n’envoie qu’aux adresses autorisées de l’équipe, avec une limite actuelle de deux messages par heure. Tant qu’il est utilisé avec la confirmation d’adresse activée, les nouveaux utilisateurs risquent de ne pas recevoir leur confirmation ni les liens de récupération de mot de passe. Il faut configurer un service SMTP ou désactiver la confirmation d’adresse pour que les inscriptions publiques aboutissent sans email; dans ce second cas, la récupération par email ne fonctionnera pas correctement.
- Relever les lieux et durées de conservation des journaux et sauvegardes chez Supabase et Vercel. Ne pas déduire de la région Paris de la base la localisation du service d’envoi des e-mails.
- Si Vercel Analytics ou d’autres services tiers sont activés, les ajouter à l’information. Les cartes et drapeaux peuvent charger des ressources depuis des CDN externes.
- Si Atlas est adopté par un établissement, compléter les règles applicables aux comptes d’élèves avec l’établissement et son DPO, s’il en a un.

Les choix de base légale indiqués dans la politique sont : fournir les fonctions personnelles demandées et assurer la sécurité du service. Ils doivent être réévalués si les finalités ou les fonctions d’Atlas changent.
