import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
    return (
        <main className="privacy-page">
            <header className="privacy-page-header">
                <p className="section-kicker">Atlas · Vos données</p>
                <h1>Politique de confidentialité</h1>
                <p>Dernière mise à jour : 30 septembre 2026</p>
            </header>

            <aside className="privacy-setup-note" role="note">
                <strong>Cette politique n’est pas encore prête pour une utilisation avec une classe.</strong>
                <p>L’identité et le contact du responsable du traitement, le cadre défini avec l’établissement et plusieurs réglages des fournisseurs doivent encore être confirmés. La région Paris concerne la base de données Supabase seulement ; elle ne confirme pas le lieu de traitement de l’authentification, des e-mails, des journaux ou des sauvegardes.</p>
            </aside>

            <section aria-labelledby="student-summary-title">
                <h2 id="student-summary-title">En bref, pour les élèves</h2>
                <p>Tu peux jouer aux quiz publics sans compte. Si tu crées un compte, Atlas utilise ton adresse e-mail et enregistre tes quiz personnalisés, tes résultats et ta progression pour te montrer tes records et tes révisions. Tu peux exporter tes données ou supprimer ton compte depuis le menu du compte.</p>
                <p>Si Atlas est proposé dans un cours, demande à ton enseignant si l’établissement a validé son utilisation avant de créer un compte. N’écris pas de nom, d’adresse, de coordonnées ni d’informations sur une autre personne dans un titre ou une description de quiz.</p>
            </section>

            <section>
                <h2>Qui traite vos données ?</h2>
                <p>Le responsable du traitement et son adresse de contact doivent être indiqués ici avant l’ouverture aux élèves. Si Atlas est utilisé dans le cadre d’un établissement, celui-ci doit déterminer avec son délégué à la protection des données, s’il en a un, qui décide des finalités et des moyens du traitement et quel accord encadre le rôle de l’éditeur d’Atlas.</p>
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
                <p>La base légale dépend du contexte d’utilisation et doit être déterminée par le responsable du traitement. Elle n’a pas encore été confirmée pour un usage scolaire ; cette page ne doit pas être présentée comme définitive tant que ce point et les rôles de l’établissement et de l’éditeur n’ont pas été validés.</p>
                <p>Les données du compte et les résultats sont conservés jusqu’à la suppression du compte dans Atlas. Les durées applicables aux journaux et sauvegardes des fournisseurs restent à confirmer. Une durée et une règle de suppression après inactivité doivent également être définies avant l’utilisation avec des élèves.</p>
            </section>

            <section>
                <h2>Fournisseurs et ressources externes</h2>
                <p><strong>Supabase</strong> fournit l’authentification et la base de données. La région connue de la base du projet est Paris (eu-west-3) ; le traitement de l’authentification et des e-mails doit être confirmé dans les réglages du projet. <strong>Vercel</strong> héberge le site ; ses fonctions activées, ses lieux de traitement et les durées de conservation doivent être vérifiés. Les cartes et drapeaux peuvent charger des ressources depuis jsDelivr, unpkg, FlagCDN et Wikimedia Commons. Si une image de profil distante est utilisée, son hébergeur reçoit également une requête. Ces fournisseurs reçoivent les données techniques habituelles d’une requête web, comme l’adresse IP et le navigateur.</p>
                <p>Les transferts hors EEE éventuels, les accords de sous-traitance et les délais de conservation des journaux et sauvegardes restent à vérifier auprès de Supabase, Vercel et des fournisseurs de ressources.</p>
            </section>

            <section>
                <h2>Cookies et stockage du navigateur</h2>
                <p>Aucun cookie publicitaire ou traceur de mesure d’audience n’est installé par Atlas. Supabase Auth conserve une session de connexion dans le stockage local du navigateur pour maintenir votre compte connecté. Vous pouvez vous déconnecter depuis le menu du compte ; effacer le stockage du navigateur vous déconnecte également.</p>
            </section>

            <section>
                <h2>Vos droits et les actions disponibles</h2>
                <p>Selon les règles applicables, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer aux traitements concernés. Depuis le menu du compte, vous pouvez télécharger un export JSON de vos données ou supprimer le compte et les données associées. La fonction Supabase <code>delete-account</code> est déployée pour effectuer cette suppression. Le responsable répond aux demandes dans le délai prévu par le RGPD, généralement un mois.</p>
                <p>Vous pouvez aussi contacter le responsable du traitement à l’adresse qui doit être publiée ci-dessus. Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de l’autorité de protection des données compétente, notamment la CNIL en France.</p>
            </section>

            <p className="privacy-back-link"><Link to="/">Retour à Atlas</Link></p>
        </main>
    );
}
