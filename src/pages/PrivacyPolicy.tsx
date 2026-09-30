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
                <strong>Informations éditeur à compléter avant de présenter cette page comme définitive.</strong>
                <p>L’identité et l’adresse de contact du responsable, les régions exactes d’hébergement, les accords de traitement avec les fournisseurs et leurs délais de conservation doivent être confirmés par l’éditeur.</p>
            </aside>

            <section>
                <h2>Qui traite vos données ?</h2>
                <p>Le responsable du traitement est l’éditeur d’Atlas. Son identité et son adresse de contact doivent être renseignées ici. Pour toute question sur vos données, utilisez l’adresse de contact publiée par l’éditeur du site.</p>
            </section>

            <section>
                <h2>Quelles données et pourquoi ?</h2>
                <ul>
                    <li><strong>Compte :</strong> adresse e-mail et identifiant de compte, pour créer une session et protéger l’accès aux fonctions personnelles.</li>
                    <li><strong>Quiz personnels :</strong> titre, description, questions et paramètres, pour les enregistrer et les modifier.</li>
                    <li><strong>Résultats :</strong> scores, nombre de questions, date, mode et périmètre du quiz, pour afficher les records et calculer les comparaisons agrégées entre joueurs.</li>
                    <li><strong>Progression et révision :</strong> réponses réussies ou à réviser par pays et éléments conservés dans l’espace de révision, lorsque ces fonctions sont utilisées.</li>
                    <li><strong>Données techniques :</strong> les fournisseurs d’hébergement et de base de données peuvent traiter l’adresse IP, le navigateur, les horodatages et les journaux nécessaires au fonctionnement et à la sécurité de leurs services.</li>
                </ul>
                <p>Atlas ne demande pas de données sensibles et aucun outil publicitaire ou de mesure d’audience n’est intégré au code du site.</p>
            </section>

            <section>
                <h2>Base et durée de conservation</h2>
                <p>Les données nécessaires au compte, aux quiz enregistrés et à la progression sont traitées pour fournir les fonctions que vous demandez (article 6, paragraphe 1, point b du RGPD). La sécurité du service et les comparaisons de scores reposent sur l’intérêt légitime de l’éditeur à faire fonctionner et protéger Atlas (article 6, paragraphe 1, point f) ; vous pouvez vous opposer à ce traitement dans les conditions prévues par le RGPD.</p>
                <p>Les données rattachées au compte sont conservées tant que celui-ci existe, puis leur suppression est demandée aux systèmes Atlas et Supabase. Les délais d’effacement des sauvegardes et journaux des fournisseurs dépendent de leurs réglages et contrats et doivent être vérifiés par l’éditeur.</p>
            </section>

            <section>
                <h2>Fournisseurs et ressources externes</h2>
                <p><strong>Supabase</strong> fournit l’authentification et la base de données. <strong>Vercel</strong> héberge le site. Les cartes et drapeaux peuvent aussi charger des ressources depuis jsDelivr, unpkg, FlagCDN et Wikimedia Commons. Si le compte fournit une image de profil distante, son hébergeur reçoit également une requête. Lorsqu’une ressource distante est demandée, son fournisseur reçoit les données techniques habituelles d’une requête web, dont l’adresse IP et le navigateur. Ces ressources servent aux cartes, aux drapeaux et au profil, pas à la publicité.</p>
                <p>Les régions de stockage, mécanismes de transfert hors EEE, contrats de sous-traitance et durées de journaux doivent être vérifiés dans les comptes Supabase, Vercel et des fournisseurs de ressources utilisés.</p>
            </section>

            <section>
                <h2>Cookies et stockage du navigateur</h2>
                <p>Aucun cookie publicitaire ou traceur de mesure d’audience n’est installé par Atlas. Supabase Auth conserve une session de connexion dans le stockage local du navigateur pour maintenir votre compte connecté. Vous pouvez vous déconnecter depuis le menu du compte ; effacer le stockage du navigateur vous déconnecte également.</p>
            </section>

            <section>
                <h2>Vos droits et les actions disponibles</h2>
                <p>Selon les règles applicables, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer aux traitements concernés. Depuis le menu du compte, vous pouvez télécharger un export JSON de vos données ou demander la suppression du compte et des données associées. La suppression en libre-service requiert le déploiement de la fonction Supabase <code>delete-account</code>.</p>
                <p>Vous pouvez aussi contacter le responsable du traitement à l’adresse qui doit être publiée ci-dessus. Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de l’autorité de protection des données compétente, notamment la CNIL en France.</p>
            </section>

            <p className="privacy-back-link"><Link to="/">Retour à Atlas</Link></p>
        </main>
    );
}
