from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load the word dataset
df = pd.read_csv("words/dataset.csv")


def get_question_row(question_id):
    try:
        row_id = int(question_id)
    except (TypeError, ValueError):
        return None

    if row_id not in df.index:
        return None
    return df.loc[row_id]


@app.route("/random", methods=["GET"])
def get_random_place():
    place = df.sample(1).iloc[0]
    response = {
        "questionId": str(place.name),
        "admLevel": place["suffix_stripped"],
        "latitude": place["latitude"],
        "longitude": place["longitude"],
        "admLevelKana": place["suffix_kana"],
    }

    # Mode based response
    # Drawing mode needs the kana as its prompt.
    # Reading mode needs the kanji.
    if request.args.get("mode") == "draw":
        response["hiragana"] = place["name_kana_base"]
    if request.args.get("mode") == "reading":
        response["kanji"] = place["name_kanji_base"]

    return jsonify(response)


@app.route("/giveup", methods=["POST"])
def give_up():
    data = request.json or {}
    question_id = data.get("questionId")

    if not question_id:
        return jsonify({"error": "Invalid request"}), 400

    place = get_question_row(question_id)
    if place is None:
        return jsonify({"error": "Question not found"}), 404

    return jsonify(
        {
            "kanji": place["name_kanji_base"],
            "hiragana": place["name_kana_base"],
            "romaji": place["name_romaji_base"],
        }
    )


@app.route("/guess", methods=["POST"])
def guess():
    data = request.json
    question_id = data.get("questionId")
    guess = data.get("guess")
    guess = guess.lower().replace(" ", "") if guess else None

    if not question_id or not guess:
        return jsonify({"error": "Invalid request"}), 400

    place = get_question_row(question_id)
    if place is None:
        return jsonify({"error": "Question not found"}), 404

    kanji = place["name_kanji_base"]

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
    question_id = data.get("questionId")
    kana = data.get("kana")
    guess = data.get("guess")

    if not question_id or not kana or not guess:
        return jsonify({"error": "Invalid request"}), 400

    place = get_question_row(question_id)
    if place is None:
        return jsonify({"error": "Question not found"}), 404

    if place["name_kana_base"] != kana:
        return jsonify({"error": "Kana not found"}), 404

    if guess == place["name_kanji_base"]:
        return jsonify({"result": "correct"})
    return jsonify({"result": "incorrect"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
