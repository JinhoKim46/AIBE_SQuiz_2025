document.addEventListener('DOMContentLoaded', () => {
    const quizButtons = document.querySelectorAll('.quiz-btn');
    const quizPopup = document.getElementById('quiz-popup');
    const quizImage = document.getElementById('quiz-image');
    const quizAnswer = document.getElementById('quiz-answer');
    const quizContent = document.getElementById('quiz-content');
    const correctBtn = document.getElementById('quiz-correct-btn');
    const wrongBtn = document.getElementById('quiz-wrong-btn');
    const teamOptions = document.getElementById('team-options');
    const closeModal = document.getElementById('close-modal');
    const teamModal = document.getElementById('team-selection-modal');
    const undoButton = document.getElementById('undo-button');
    const teamForm = document.getElementById('team-registration-form');
    const teamList = document.getElementById('team-scores');
    let timerInterval;
    let lastBlockedButton = null;
    const undoHistory = []; // To store a history of actions for undo
    let currentCategory = '';
    let currentPoints = 0;

    // Dynamically toggle answer visibility on image click
    quizImage.addEventListener('click', () => {
        clearInterval(timerInterval); // Stop the timer
        quizAnswer.style.display = 'block'; // Show the answer

        if (currentCategory === 'Famous') {
            // Fetch the updated image for "Famous" category
            fetch(`/get_answer_image?category=${currentCategory}&points=${currentPoints}`)
                .then(response => response.json())
                .then(data => {
                    if (data.answerImage) {
                        quizImage.src = `${data.answerImage}?t=${new Date().getTime()}`; // Update image dynamically
                        quizAnswer.textContent = `Answer: ${data.answer}`;
                    } else {
                        console.error('Answer image not found.');
                    }
                })
                .catch(err => console.error('Error fetching answer image:', err));
        }
    });


    // Handle quiz button clicks
    quizButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            currentPoints = parseInt(button.dataset.points, 10);

            fetch(`/quiz/${currentCategory}/${currentPoints}`)
                .then(response => response.json())
                .then(data => {
                    if (data.quiz_type === 'image') {
                        quizImage.src = data.content;
                        quizImage.style.display = 'block';
                        quizContent.textContent = '';
                        quizAnswer.textContent = `Answer: ${data.answer || 'No answer available'}`;
                    } else {
                        quizImage.style.display = 'none';
                        quizContent.textContent = data.content;
                        quizAnswer.textContent = `Answer: ${data.answer || 'No answer available'}`;
                    }

                    quizAnswer.style.display = 'none'; // Hide the answer initially
                    quizPopup.style.display = 'block';
                    button.disabled = true;
                    button.style.backgroundColor = 'red';
                    lastBlockedButton = button;

                    startTimer(data.timer);
                    undoButton.classList.remove('hidden');
                });
        });

        // Allow re-enabling blocked quizzes with right-click
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (button.disabled) {
                if (confirm('Do you want to make this quiz available again?')) {
                    button.disabled = false;
                    button.style.backgroundColor = '';
                }
            }
        });
    });
    
    // Load teams into the team dashboard
    const loadTeams = () => {
        fetch('/get_teams')
            .then(response => response.json())
            .then(data => {
                teamList.innerHTML = '';
                data.forEach(team => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${team.name}</td><td>${team.score}</td>`;
                    teamList.appendChild(row);
                });
            });
    };

    // Populate the team selection modal
    const loadTeamOptions = () => {
        fetch('/get_teams')
            .then(response => response.json())
            .then(data => {
                teamOptions.innerHTML = '';
                data.forEach(team => {
                    const teamItem = document.createElement('li');
                    teamItem.textContent = `${team.name} (${team.score} points)`;
                    teamItem.dataset.teamId = team.id;
                    teamItem.style.cursor = 'pointer';
                    teamOptions.appendChild(teamItem);
                });
            });
    };

    // Start timer with progress bar
    const startTimer = (duration) => {
        const progressBar = document.getElementById('quiz-progress-bar');
        const timerText = document.getElementById('quiz-timer');
        let timeLeft = duration;
        const totalDuration = duration;

        // Reset the progress bar to full width
        progressBar.style.width = '100%';

        clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(() => {
            timeLeft--;

            // Update timer text
            timerText.textContent = `Time Left: ${timeLeft}s`;

            // Calculate the progress percentage
            const progressPercentage = (timeLeft / totalDuration) * 100;

            // Update the progress bar width
            progressBar.style.width = `${progressPercentage}%`;

            // Stop timer when time runs out
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerText.textContent = "Time's up!";
                progressBar.style.width = '0%'; // Set progress bar to empty
            }
        }, 1000); // Decrease every second
    };

    // Handle quiz button clicks
    quizButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const points = parseInt(button.dataset.points, 10);

            fetch(`/quiz/${category}/${points}`)
                .then(response => response.json())
                .then(data => {
                    if (data.quiz_type === 'image') {
                        quizImage.src = data.content;
                        quizImage.style.display = 'block';
                        quizContent.textContent = '';
                    } else {
                        quizImage.style.display = 'none';
                        quizContent.textContent = data.content;
                    }

                    correctBtn.dataset.points = points;
                    quizPopup.style.display = 'block';
                    button.disabled = true;
                    button.style.backgroundColor = 'red';
                    lastBlockedButton = button;

                    startTimer(data.timer);
                    undoButton.classList.remove('hidden');
                });
        });

        // Allow re-enabling blocked quizzes with right-click
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            if (button.disabled) {
                if (confirm('Do you want to make this quiz available again?')) {
                    button.disabled = false;
                    button.style.backgroundColor = '';
                }
            }
        });
    });

    // Undo button functionality
    undoButton.addEventListener('click', () => {
        if (undoHistory.length > 0) {
            const lastAction = undoHistory.pop(); // Get the most recent action

            // Re-enable the last blocked button
            if (lastAction.button) {
                lastAction.button.disabled = false;
                lastAction.button.style.backgroundColor = 'limegreen';
            }

            // Revert the last team's score
            fetch('/update_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id: lastAction.teamId, points: -lastAction.points })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        loadTeams(); // Refresh the team list
                        console.log(`Reverted ${lastAction.points} points for team: ${data.team.name}`);
                    } else {
                        console.error(data.error || 'Failed to revert score');
                    }
                });

            // Hide the Undo button if there are no more actions to undo
            if (undoHistory.length === 0) {
                undoButton.classList.add('hidden');
            }
        }
    });

    // Handle correct button click
    correctBtn.addEventListener('click', () => {
        loadTeamOptions(); // Load teams for selection
        teamModal.style.display = 'flex'; // Show the team selection modal
    });

    // Handle team selection for points assignment
    teamOptions.addEventListener('click', (event) => {
        const selectedTeam = event.target;
        const teamId = parseInt(selectedTeam.dataset.teamId, 10);
        const quizPoints = parseInt(correctBtn.dataset.points, 10);

        if (!teamId) {
            alert('Invalid team selected.');
            return;
        }

        // Assign points to the team
        fetch('/update_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team_id: teamId, points: quizPoints })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadTeams(); // Refresh the team list
                    console.log(`Assigned ${quizPoints} points to team: ${data.team.name}`);
                    
                    // Save the last action for undo
                    undoHistory.push({
                        teamId: teamId,
                        points: quizPoints,
                        button: lastBlockedButton
                    });
                } else {
                    console.error(data.error || 'Failed to update score');
                }
            });

        // Close the modal and the quiz popup
        teamModal.style.display = 'none';
        quizPopup.style.display = 'none';
        clearInterval(timerInterval);
    });

    // Handle wrong button click
    wrongBtn.addEventListener('click', () => {
        quizPopup.style.display = 'none';
        clearInterval(timerInterval);
    });

    // Close the team selection modal
    closeModal.addEventListener('click', () => {
        teamModal.style.display = 'none';
    });

    // Register a new team
    teamForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const teamName = document.getElementById('team-name').value;

        fetch('/register_team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: teamName })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadTeams();
                    teamForm.reset();
                } else {
                    alert(data.error || 'Failed to register team');
                }
            });
    });

    // Initial load of teams
    loadTeams();
});
