# AIBE S-Quiz Time
## Description
A quiz application for the AIBE 2025 event. `Teams` are reset at every new runs. 

## Instructions
Add quizzes in `data/quizzes.json`. The format is as follows:
```json
 {
        "category": "Sports",
        "points": 10,
        "content": "static/figures/sports_messi_30.jpg",
        "quiz_type": "image",
        "timer": 30
    }
```
- `category`: The category of the quiz.
- `points`: The points for the quiz.
- `content`: The path to the image file for image type, or quiz contents.
- `quiz_type`: The type of the quiz. It can be either `image`, `text`, `audio`.

If you have image type quiz, add the image file in `static/figures` folder.

## How to run
- Clone the repository.
- Create a conda environment using `environment.yml` file.
  - `conda env create -f environment.yml`
- Activate the environment.
  - `conda activate aibe_squiz`
- Run the app.
  - `python app.py`