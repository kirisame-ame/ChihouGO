import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useGame } from "./hooks/useGame";
import { translations, type Language } from "./types/translations";
import usFlag from "./assets/img/us.png";
import jpFlag from "./assets/img/jp.png";

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();

    useEffect(() => {
        map.setView([lat, lng], 10);
    }, [map, lat, lng]);

    return <Marker position={[lat, lng]} />;
}

function App() {
    const [language, setLanguage] = useState<Language>(() => {
        const lang =
            navigator.language || (navigator as any).userLanguage || "en";
        return lang.startsWith("ja") ? "ja" : "en";
    });

    const t = translations[language];
    const game = useGame();

    useEffect(() => {
        game.loadNewQuestion();
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const form = e.currentTarget.form;
            if (form) {
                const submitButton = form.querySelector(
                    'button[type="submit"]',
                ) as HTMLButtonElement;
                submitButton?.click();
            }
        }
    };

    const handleGuess = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const guess = formData.get("guess") as string;
        if (guess.trim()) {
            game.submitGuess(guess);
            e.currentTarget.reset();
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-5 border border-neutral-700 rounded-xl bg-neutral-900 my-10">
            <h1 className="text-3xl inline">{t.title}</h1>
            <p className="text-neutral-400 mb-2">
                {t.devBy}{" "}
                <a
                    className="text-cyan-400 hover:underline"
                    href="https://github.com/kirisame-ame"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Kirisame-ame
                </a>
            </p>

            <div className="flex items-center justify-center gap-3">
                <button
                    className="mt-2 rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-1 flex items-center gap-2 cursor-pointer text-neutral-100 hover:bg-neutral-700"
                    onClick={() => setLanguage("en")}
                >
                    <img
                        src={usFlag}
                        className="w-7 h-7 object-cover"
                        alt="English"
                    />
                    English
                </button>
                <button
                    className="mt-2 rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-1 flex items-center gap-2 cursor-pointer text-neutral-100 hover:bg-neutral-700"
                    onClick={() => setLanguage("ja")}
                >
                    <img
                        src={jpFlag}
                        className="w-7 h-7 object-cover"
                        alt="日本語"
                    />
                    日本語
                </button>
            </div>

            <div className="flex flex-col items-center">
                <p className="font-bold text-neutral-100">
                    {t.score} {game.score}
                </p>
                <p className="text-3xl">
                    {game.isLoading ? t.loading : game.currentPlace?.kanji}
                </p>
                <div className="flex min-h-8">
                    <p className="font-bold">
                        {game.lastResult === "correct" && `✅ ${t.correct}`}
                        {game.lastResult === "incorrect" && `❌ ${t.wrong}`}
                        {game.showNext &&
                            game.currentPlace &&
                            `${game.currentPlace.hiragana} - ${game.currentPlace.romaji}`}
                    </p>
                </div>
            </div>

            {game.currentPlace && (
                <MapContainer
                    className="w-full h-72 mb-3 border border-neutral-700 rounded-xl"
                    center={[
                        game.currentPlace.latitude,
                        game.currentPlace.longitude,
                    ]}
                    zoom={10}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater
                        lat={game.currentPlace.latitude}
                        lng={game.currentPlace.longitude}
                    />
                </MapContainer>
            )}

            {game.showNext && (
                <div className="flex justify-center">
                    <button
                        className="justify-center rounded-lg bg-neutral-800 border border-neutral-600 px-4 h-8 font-bold text-neutral-100 hover:bg-neutral-700 cursor-pointer"
                        onClick={game.nextQuestion}
                    >
                        {t.next}
                    </button>
                </div>
            )}

            {!game.showNext && (
                <form
                    onSubmit={handleGuess}
                    className="flex gap-2 justify-center items-center"
                >
                    <button
                        type="button"
                        className="h-8 px-3 bg-neutral-800 border border-neutral-600 text-neutral-100 rounded hover:bg-neutral-700 cursor-pointer"
                        onClick={game.giveUp}
                    >
                        {t.giveup}
                    </button>
                    <input
                        type="text"
                        className="h-8 w-36 px-2 bg-neutral-800 border border-neutral-600 text-neutral-100 rounded"
                        name="guess"
                        placeholder={t.guess}
                        onKeyDown={handleKeyPress}
                        disabled={game.isLoading}
                    />
                    <button
                        type="submit"
                        className="h-8 px-3 bg-neutral-800 border border-neutral-600 text-neutral-100 rounded hover:bg-neutral-700 cursor-pointer"
                        disabled={game.isLoading}
                    >
                        {t.submit}
                    </button>
                </form>
            )}

            <p className="text-neutral-400 mt-2">{t.hiraganaRomaji}</p>
            <p className="text-xs text-neutral-500">{t.hepburnNote}</p>
        </div>
    );
}

export default App;
