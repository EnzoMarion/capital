import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
    return (
        <main className="privacy-page">
            <header className="privacy-page-header">
                <p className="section-kicker">Atlas · Vos données</p>
                <h1>Politique de confidentialité</h1>
                <p>Dernière mise à jour : 1 octobre 2026</p>
            </header>

            <aside className="privacy-setup-note" role="note">
                <strong>Atlas est un projet personnel gratuit, indépendant des établissements scolaires.</strong>
                <p>Les quiz publics se jouent sans compte et la création de comptes est ouverte pour les fonctions personnelles. Si un établissement souhaite organiser officiellement l’utilisation d’Atlas avec des élèves, les rôles et les conditions devront être convenus avant cet usage. Les durées des journaux et sauvegardes de certains fournisseurs restent à vérifier. La région Paris concerne la base de données du projet, y compris les informations de compte Supabase Auth ; elle ne confirme pas le lieu d’envoi des e-mails.</p>
            </aside>

            <section aria-labelledby="student-summary-title">
                <h2 id="student-summary-title">En bref, pour les élèves</h2>
                <p>Tu peux jouer aux quiz publics sans compte. Si tu crées un compte, Atlas utilise ton adresse e-mail et enregistre tes quiz personnalisés, tes résultats et ta progression pour te montrer tes records et tes révisions. Tu peux exporter tes données ou supprimer ton compte depuis le menu du compte.</p>
                <p>Un enseignant peut partager le lien d’Atlas sans que l’établissement gère les comptes : chaque compte reste personnel et indépendant. N’écris pas le nom de ton école, de ta classe, de tes coordonnées ni d’informations sur une autre personne dans un titre ou une description de quiz. Si tu es mineur, demande à un parent ou à un adulte de confiance de lire ces informations avec toi avant de créer un compte.</p>
            </section>

            <section>
                <h2>Qui traite vos données ?</h2>
                <p>Pour l’utilisation d’Atlas en dehors d’un établissement, le responsable du traitement est Enzo Marion, éditeur indépendant de l’application. Pour exercer tes droits ou poser une question sur tes données, écris à <a href="mailto:marionenzo26gre@gmail.com">marionenzo26gre@gmail.com</a>. Les informations sur l’éditeur et l’hébergeur figurent aussi dans les <Link to="/mentions-legales">mentions légales</Link>. Si Atlas est utilisé dans le cadre d’un établissement, celui-ci doit déterminer avec son délégué à la protection des données, s’il en a un, qui décide des finalités et des moyens du traitement et quel accord encadre le rôle de l’éditeur d’Atlas.</p>
            </section>

            <section>
                <h2>Quelles données et pourquoi ?</h2>
                <ul>
                    <li><strong>Compte :</strong> adresse e-mail et identifiant de compte, pour créer une session et protéger l’accès aux fonctions personnelles.</li>
                    <li><strong>Quiz personnels :</strong> titre, description, sélection des questions et paramètres, pour les enregistrer et les modifier.</li>
                    <li><strong>Résultats :</strong> pour les comptes connectés, scores, nombre de questions, date, mode et périmètre du quiz, pour afficher les records et calculer les comparaisons entre joueurs.</li>
                    <li><strong>Progression et révision :</strong> réponses réussies ou à réviser par pays et éléments conservés dans l’espace de révision, lorsque ces fonctions sont utilisées.</li>
                    <li><strong>Données techniques :</strong> les fournisseurs d’hébergement et de base de données peuvent traiter l’adresse IP, le navigateur, les horodatages et les journaux nécessaires au fonctionnement et à la sécurité de leurs services.</li>
                </ul>
                <p>La création d’un compte n’est pas nécessaire pour jouer aux quiz publics. Le code du site n’intègre pas d’outil publicitaire ou de mesure d’audience ; les réglages du compte d’hébergement doivent aussi être vérifiés. Les titres et descriptions de quiz sont du texte libre : n’y inscris pas de données sensibles ni d’informations sur d’autres personnes.</p>
            </section>

            <section>
                <h2>Base et durée de conservation</h2>
                <p>Pour le compte, les quiz personnels, les résultats et la progression, la base légale est l’exécution du service gratuit demandé par la personne : ces données sont nécessaires pour fournir ces fonctions. Pour les journaux techniques strictement nécessaires à la sécurité et à la prévention des abus, la base légale est l’intérêt légitime à protéger et faire fonctionner Atlas. Les quiz publics restent accessibles sans compte et leurs réponses ne sont pas enregistrées dans un profil.</p>
                <p>Tu peux supprimer ton compte à tout moment depuis Atlas ; les quiz, résultats et données de progression associés sont alors supprimés. Le projet prévoit un nettoyage automatique quotidien des comptes sans connexion depuis 24 mois, avec leurs données associées. Ce nettoyage nécessite les secrets serveur et l’activation du job planifié dans Vercel ; tant que son exécution n’a pas été confirmée, ne considère pas cette suppression automatique comme active. Aucun avertissement par e-mail n’est envoyé avant la suppression. Si un compte n’a jamais été utilisé, le délai part de sa date de création. Les durées de conservation des journaux et sauvegardes des fournisseurs ne sont pas encore confirmées.</p>
            </section>

            <section>
                <h2>Fournisseurs et ressources externes</h2>
                <p><strong>Supabase</strong> fournit l’authentification et la base de données. Le projet de base de données est hébergé à Paris (eu-west-3) ; cela ne permet pas de déduire le lieu de traitement des e-mails, journaux ou sauvegardes. Les e-mails d’authentification sont envoyés par le service intégré de Supabase, sans SMTP personnalisé. <strong>Vercel Inc.</strong> héberge le site ; consulte sa <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noreferrer">notice de confidentialité</a> pour ses propres traitements et transferts. La région des fonctions, la rétention des journaux et la localisation/rétention des sauvegardes configurées pour ce projet doivent être confirmées dans les comptes fournisseurs. Les cartes et drapeaux peuvent charger des ressources depuis jsDelivr, unpkg, FlagCDN et Wikimedia Commons. Si une image de profil distante est utilisée, son hébergeur reçoit également une requête. Ces fournisseurs reçoivent des données techniques liées aux requêtes, comme l’adresse IP et le navigateur.</p>
                <p>Les transferts hors EEE éventuels, les accords de sous-traitance et les délais de conservation des journaux et sauvegardes restent à vérifier auprès de Supabase, Vercel et des fournisseurs de ressources.</p>
            </section>

            <section>
                <h2>Cookies et stockage du navigateur</h2>
                <p>Aucun cookie publicitaire ou traceur de mesure d’audience n’est installé par Atlas. Supabase Auth conserve une session de connexion dans le stockage local du navigateur pour maintenir votre compte connecté. Vous pouvez vous déconnecter depuis le menu du compte ; effacer le stockage du navigateur vous déconnecte également.</p>
                <p>Si tu installes Atlas comme application (PWA), ton navigateur conserve aussi une copie des fichiers de l’interface pour accélérer son ouverture et afficher la structure de l’application si la connexion est interrompue. Le service worker ne met pas en cache les appels d’authentification ni les données des quiz enregistrées dans Supabase : ces fonctions nécessitent une connexion. Tu peux effacer ce cache depuis les réglages de stockage du navigateur ou en supprimant les données du site.</p>
            </section>

            <section>
                <h2>Vos droits et les actions disponibles</h2>
                <p>Selon les règles applicables, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer aux traitements concernés. Depuis le menu du compte, vous pouvez télécharger un export JSON de vos données ou supprimer le compte et les données associées. La fonction Supabase <code>delete-account</code> est prévue pour effectuer cette suppression. Le responsable répond aux demandes dans le délai prévu par le RGPD, généralement un mois.</p>
                <p>Vous pouvez aussi contacter le responsable du traitement à l’adresse <a href="mailto:marionenzo26gre@gmail.com">marionenzo26gre@gmail.com</a>. Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de l’autorité de protection des données compétente, notamment la CNIL en France.</p>
            </section>

            <p className="privacy-back-link"><Link to="/">Retour à Atlas</Link></p>
        </main>
    );
}
