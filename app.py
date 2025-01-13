import json

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

QUIZ_FILE = "data/quizzes.json"
TEAM_FILE = "data/teams.json"

def reset_teams():
    """Reset the existing teams.json."""
    save_json(TEAM_FILE, [])

def load_json(file_path):
    """Load JSON data from a file, or return an empty list if the file is empty or missing."""
    try:
        with open(file_path, "r") as file:
            data = file.read()
            return json.loads(data) if data else []  # Return an empty list if the file is empty
    except FileNotFoundError:
        # If the file does not exist, create it with an empty list
        with open(file_path, "w") as file:
            json.dump([], file, indent=4)
        return []


def save_json(file_path, data):
    """Save JSON data to a file."""
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)

@app.route('/')
def index():
    quizzes = load_json(QUIZ_FILE)
    categories = sorted(list(set(quiz["category"] for quiz in quizzes)))
    points = sorted(list(set(quiz["points"] for quiz in quizzes)))
    return render_template('board.html', categories=categories, points=points)

@app.route('/quiz/<category>/<int:points>')
def get_quiz(category, points):
    quizzes = load_json(QUIZ_FILE)
    quiz = next((q for q in quizzes if q["category"] == category and q["points"] == points), None)
    if quiz:
        return jsonify(quiz)
    return jsonify({"error": "Quiz not found"}), 404


@app.route('/register_team', methods=['POST'])
def register_team():
    """Register a new team dynamically and save to JSON."""
    teams = load_json(TEAM_FILE)  # Load current teams from JSON
    data = request.json           # Get the posted team data
    team_name = data.get("name")

    if not team_name:
        return jsonify({"error": "Team name is required"}), 400

    # Check if team already exists
    if any(team["name"] == team_name for team in teams):
        return jsonify({"error": "Team already exists"}), 400

    # Create a new team and append it to the list
    new_team = {"id": len(teams) + 1, "name": team_name, "score": 0}
    teams.append(new_team)

    # Save the updated list back to JSON
    save_json(TEAM_FILE, teams)

    return jsonify({"success": True, "team": new_team})

@app.route('/get_teams', methods=['GET'])
def get_teams():
    """Fetch all teams from JSON, sorted by score."""
    teams = load_json(TEAM_FILE)  # Load teams from JSON file
    sorted_teams = sorted(teams, key=lambda t: t["score"], reverse=True)  # Sort by score
    return jsonify(sorted_teams)  # Return the sorted list of teams as JSON


@app.route('/update_score', methods=['POST'])
def update_score():
    data = request.json
    team_id = data.get('team_id')
    points = data.get('points')

    # Load teams from JSON file
    teams = load_json(TEAM_FILE)

    # Find the team and update the score
    for team in teams:
        if team['id'] == team_id:  # Ensure team_id matches
            team['score'] += points
            save_json(TEAM_FILE, teams)  # Save the updated scores
            return jsonify({'success': True, 'team': team})

    return jsonify({'success': False, 'error': 'Team not found'}), 404




if __name__ == '__main__':
    reset_teams()
    app.run(debug=True)
