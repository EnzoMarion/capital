import { Link } from "react-router-dom";

export default function LegalNotice() {
    return (
        <main className="privacy-page">
            <header className="privacy-page-header">
                <p className="section-kicker">Atlas · Informations légales</p>
                <h1>Mentions légales</h1>
                <p>Dernière mise à jour : 1 octobre 2026</p>
            </header>

            <section>
                <h2>Éditeur du site</h2>
                <p>Atlas est un projet personnel gratuit édité à titre non professionnel par Enzo Marion.</p>
                <p>Contact : <a href="mailto:marionenzo26gre@gmail.com">marionenzo26gre@gmail.com</a>.</p>
            </section>

            <section>
                <h2>Directeur de la publication</h2>
                <p>Enzo Marion.</p>
            </section>

            <section>
                <h2>Hébergement</h2>
                <p>Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Contact : <a href="mailto:privacy@vercel.com">privacy@vercel.com</a>.</p>
            </section>

            <section>
                <h2>Données personnelles</h2>
                <p>Les informations sur les données utilisées par Atlas et l’exercice des droits sont disponibles dans la <Link to="/confidentialite">politique de confidentialité</Link>.</p>
            </section>

            <p className="privacy-back-link"><Link to="/">Retour à Atlas</Link></p>
        </main>
    );
}
