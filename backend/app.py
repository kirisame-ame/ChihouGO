from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import random

app = Flask(__name__)
CORS(app)

# Load the word dataset
df = pd.read_csv("words/dataset.csv")


@app.route("/random", methods=["GET"])
def get_random_place():
    place = df.sample(1).iloc[0]
    return jsonify(
        {
            "kanji": place["name_kanji_base"],
            "admLevel": place["suffix_stripped"],
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "hiragana": place["name_kana_base"],
            "romaji": place["name_romaji_base"],
            "admLevelKana": place["suffix_kana"],
        }
    )


@app.route("/guess", methods=["POST"])
def guess():
    data = request.json
    kanji = data.get("kanji")
    guess = data.get("guess")
    guess = guess.lower().replace(" ", "") if guess else None

    if not kanji or not guess:
        return jsonify({"error": "Invalid request"}), 400

    place = df[df["name_kanji_base"] == kanji]

    if place.empty:
        return jsonify({"error": "Kanji not found"}), 404

    correct_readings = {
        place["name_kana_base"].values[0],
        place["name_romaji_base"].values[0],
    }

    if guess in correct_readings:
        return jsonify({"result": "correct"})
    else:
        return jsonify({"result": "incorrect"})


@app.route("/guess-kanji", methods=["POST"])
def guess_kanji():
    data = request.json
    kana = data.get("kana")
    guess = data.get("guess")

    if not kana or not guess:
        return jsonify({"error": "Invalid request"}), 400

    place = df[df["name_kana_base"] == kana]
    if place.empty:
        return jsonify({"error": "Kana not found"}), 404

    if guess == place["name_kanji_base"].values[0]:
        return jsonify({"result": "correct"})
    return jsonify({"result": "incorrect"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
