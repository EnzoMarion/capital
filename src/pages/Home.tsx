export default function Home() {
    return (
        <div className="flex flex-col items-center mt-10">
            <h1 className="text-2xl font-bold mb-2">Accueil</h1>
            <p>Bienvenue sur ton site de révision des capitales !</p>
            <a href="/quiz" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Commencer le quiz</a>
        </div>
    );
}
