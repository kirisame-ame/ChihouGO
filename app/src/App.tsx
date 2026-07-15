import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useGame } from "./hooks/useGame";
import { translations, type Language } from "./types/translations";
import { DrawingQuiz } from "./components/DrawingQuiz";
import usFlag from "./assets/img/us.png";
import jpFlag from "./assets/img/jp.png";

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();

    useEffect(() => {
        map.panTo([lat, lng]);
    }, [map, lat, lng]);

    return <Marker position={[lat, lng]} />;
}

function getModeFromPath(): "reading" | "draw" {
    return window.location.pathname === "/draw" ? "draw" : "reading";
}

function App() {
    const [language, setLanguage] = useState<Language>(() => {
        const lang =
            navigator.language || (navigator as any).userLanguage || "en";
        return lang.startsWith("ja") ? "ja" : "en";
    });
    const [mode, setMode] = useState<"reading" | "draw">(getModeFromPath);
    const guessInputRef = useRef<HTMLInputElement>(null);

    const t = translations[language];
    const game = useGame();
    const { loadNewQuestion } = game;

    useEffect(() => {
        loadNewQuestion(mode);
    }, [loadNewQuestion, mode]);

    useEffect(() => {
        const handlePopState = () => {
            setMode(getModeFromPath());
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (mode === "reading" && !game.isLoading) {
            guessInputRef.current?.focus();
        }
    }, [mode, game.currentPlace, game.isLoading]);

    const switchMode = (nextMode: "reading" | "draw") => {
        if (nextMode === mode) return;

        window.history.pushState({}, "", nextMode === "draw" ? "/draw" : "/reading");
        setMode(nextMode);
    };

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
            guessInputRef.current?.focus();
        }
    };

    return (
        <div className="max-w-2xl mx-auto min-h-screen p-5    bg-neutral-900 ">
            <h1 className="text-3xl inline">{t.title}</h1>
            <p className="text-neutral-400 mb-2">
                {t.devBy}{" "}
                <a
                    className="text-cyan-400 hover:underline"
                    href="https://github.com/kirisame-ame/ChihouGO"
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
                {mode === "reading" ? (
                    <div className="flex items-center">
                        <p className="text-3xl">
                            {game.isLoading
                                ? t.loading
                                : game.currentPlace?.kanji}
                        </p>
                        <ruby className="ml-3 text-2xl mb-2">
                            {game.isLoading
                                ? t.loading
                                : game.currentPlace?.admLevel}
                            <rt>
                                {game.isLoading
                                    ? t.loading
                                    : game.currentPlace?.admLevelKana}
                            </rt>
                        </ruby>
                    </div>
                ) : (
                    <div className="justify-center text-center">
                        <p className="text-sm text-neutral-400">
                            {t.drawPrompt}
                        </p>
                        <div className="flex items-center justify-center">
                            <p className="text-3xl">
                                {game.isLoading
                                    ? t.loading
                                    : game.currentPlace?.hiragana}
                            </p>
                            <ruby className="ml-3 text-2xl mb-2">
                                {game.isLoading
                                    ? t.loading
                                    : game.currentPlace?.admLevel}
                                <rt>
                                    {game.isLoading
                                        ? t.loading
                                        : game.currentPlace?.admLevelKana}
                                </rt>
                            </ruby>
                        </div>
                    </div>
                )}

                <div className="flex min-h-8">
                    <p className=" text-xl">
                        {game.lastResult === "correct" && `✅ ${t.correct}`}
                        {game.lastResult === "incorrect" && `❌ ${t.wrong}`}
                    </p>
                    <h3 className="text-3xl">
                        {game.showNext &&
                            game.currentPlace &&
                            (mode === "draw"
                                ? `${t.answer} ${game.currentPlace.kanji}`
                                : `${t.answer} ${game.currentPlace.hiragana} - ${game.currentPlace.romaji}`)}
                    </h3>
                </div>
            </div>

            <div className="flex justify-center gap-2 mt-4">
                <button
                    className={`px-3 py-1 rounded ${
                        mode === "reading"
                            ? "bg-cyan-600"
                            : "bg-neutral-700 hover:bg-neutral-600"
                    }`}
                    onClick={() => switchMode("reading")}
                >
                    {t.readingMode}
                </button>
                <button
                    className={`px-3 py-1 rounded ${
                        mode === "draw"
                            ? "bg-cyan-600"
                            : "bg-neutral-700 hover:bg-neutral-600"
                    }`}
                    onClick={() => switchMode("draw")}
                >
                    {t.drawMode}
                </button>
            </div>

            {mode === "reading" && game.currentPlace && (
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

            {mode === "draw" && game.currentPlace && (
                <>
                    <MapContainer
                        className="w-full h-72 mb-3 border border-neutral-700 rounded-xl"
                        center={[
                            game.currentPlace.latitude,
                            game.currentPlace.longitude,
                        ]}
                        zoom={6}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                        />
                        <MapUpdater
                            lat={game.currentPlace.latitude}
                            lng={game.currentPlace.longitude}
                        />
                    </MapContainer>
                    {!game.showNext && game.lastResult !== "correct" && (
                        <DrawingQuiz
                            questionKey={game.currentPlace.questionId}
                            isDisabled={game.isLoading}
                            onCheck={game.submitKanjiGuess}
                            onGiveUp={game.giveUp}
                            labels={t}
                        />
                    )}
                </>
            )}

            {game.showNext && (
                <div className="flex justify-center">
                    <button
                        className="justify-center rounded-lg bg-neutral-800 border border-neutral-600 px-4 h-8 font-bold text-neutral-100 hover:bg-neutral-700 cursor-pointer"
                        onClick={() => game.nextQuestion(mode)}
                    >
                        {t.next}
                    </button>
                </div>
            )}

            {!game.showNext && mode === "reading" && (
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
                        ref={guessInputRef}
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

            {mode === "reading" && (
                <>
                    <p className="text-neutral-400 mt-2">{t.hiraganaRomaji}</p>
                    <p className="text-xs text-neutral-500">{t.hepburnNote}</p>
                </>
            )}
        </div>
    );
}

export default App;
