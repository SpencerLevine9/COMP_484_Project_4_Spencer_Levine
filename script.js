// COMP 484 – Project 4 – Google Maps Quiz
// Spencer Levine

let map;
let currentQuestionIndex = 0;
let score = 0;
let answerRectangle = null;

//------------------------------------------------
// Extra Feature 1 & 3: Timer and High Score
//------------------------------------------------
let timerId = null;
let timeLeft = 0;

// high score stored in localStorage
let bestScore = 0;
const BEST_SCORE_KEY = "csunMapQuizBestScore";

// Load stored best score (if any)
const storedBest = Number(localStorage.getItem("csunMapQuizBestScore"));
if (!Number.isNaN(storedBest)) {
  bestScore = storedBest;
}

// Update the Best score
function updateHighScoreUI() {
  const highScoreEl = document.getElementById("high-score");
  if (!highScoreEl) return;

  highScoreEl.textContent = `Best score: ${bestScore} / ${QUIZ_LOCATIONS.length}`;
}

function updateTimerDisplay() {
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;
  timerEl.textContent = `Time left: ${timeLeft}s`;
}

function updateHighScoreDisplay() {
  const highScoreEl = document.getElementById("high-score");
  if (!highScoreEl) return;
  highScoreEl.textContent = `Best score: ${bestScore} / ${QUIZ_LOCATIONS.length}`;
}

function loadBestScore() {
  const saved = localStorage.getItem(BEST_SCORE_KEY);
  if (saved !== null) {
    const parsed = Number(saved);
    if (!Number.isNaN(parsed)) {
      bestScore = parsed;
    }
  }
  updateHighScoreDisplay();
}

function saveBestScore() {
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

//------------------------------------------------
// Extra Feature 1: Timer
//------------------------------------------------
function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  clearTimer();
  timeLeft = 120;              // 120 seconds = 2 minutes
  updateTimerDisplay();

  timerId = window.setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerDisplay();
      clearTimer();
      showFinalScore("Time is up!");
    }
  }, 1000);
}
// end of extra feature code

// quiiz locations 
// buildings with the real coordinates from Google Maps.
const QUIZ_LOCATIONS = [
  {
    name: "Chicano House",
    center: { lat: 34.24254471334635, lng: -118.52993979462777 }, // your existing coords
    grid: "D5",
  },
  {
    name: "Jacaranda Hall",
    center: { lat: 34.24117170635642, lng: -118.52893500416396 }, 
    grid: "?",                               
  },
  {
    name: "University Library",
    center: { lat: 34.24004442624334, lng: -118.52931503437752 }, 
    grid: "?",
  },
  {
    name: "Student Recreation Center (SRC)",
    center: { lat: 34.240010526482784, lng: -118.52494668431943 }, 
    grid: "?",
  },
  {
    name: "Autodesk Technology Engagement Center",
    center: { lat: 34.24158829209471, lng: -118.5277221942389 }, 
    grid: "?",
  },
];

// Small helper to get elements safely
function byId(id) {
  return document.getElementById(id);
}

// INIT MAP called by Google’s callback
function initMap() {
  // load high score once
  loadBestScore();
  updateHighScoreUI();
  // reset quiz state
  currentQuestionIndex = 0;
  score = 0;

  // hide play again button if visible
  const playAgainBtn = document.getElementById("play-again");
  if (playAgainBtn) {
    playAgainBtn.classList.add("hidden");
  }

  const statusEl = document.getElementById("status-message");
  if (statusEl) statusEl.textContent = "";

  // create the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 34.24, lng: -118.53 }, // nice campus overview
    zoom: 17,
    mapTypeId: "roadmap",
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    keyboardShortcuts: false,
    zoomControl: false,
  });

  // listen for guesses
  map.addListener("dblclick", handleMapDoubleClick);

  // first question & timer
  showCurrentQuestion();
  startTimer();
}

// show the current question
function showCurrentQuestion() {
  const loc = QUIZ_LOCATIONS[currentQuestionIndex];

  const infoPanel = document.querySelector("#info-panel p");
  if (infoPanel) {
    infoPanel.textContent = `${loc.name} is one of the CSUN buildings on campus.`;
  }

  // Status message shows instructions
  const statusEl = byId("status-message");
  if (statusEl) {
    statusEl.textContent =
      `Question ${currentQuestionIndex + 1} of ${QUIZ_LOCATIONS.length}: ` +
      `Double-click on the map where you think ${loc.name} is located.`;
  }

  // Re-center on the location so the user is in roughly the right area
  map.setCenter(loc.center);
}

// double click handler
function handleMapDoubleClick(event) {
  const clickLatLng = event.latLng;
  const loc = QUIZ_LOCATIONS[currentQuestionIndex];

  // Clear any previous rectangle
  if (answerRectangle) {
    answerRectangle.setMap(null);
    answerRectangle = null;
  }

  // Build a small rectangle around the correct building
  // You can tweak 0.0005 to make the box bigger/smaller
  const bounds = makeBounds(loc.center, 0.0005, 0.0005);

  const isCorrect = pointInBounds(clickLatLng, bounds);

  // Green if correct, red if wrong
  const rectColor = isCorrect ? "#00b894" : "#d63031";

  answerRectangle = new google.maps.Rectangle({
    bounds,
    map,
    strokeColor: rectColor,
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: rectColor,
    fillOpacity: 0.15,
  });

  if (isCorrect) {
    score++;
  }

  const statusEl = byId("status-message");
  if (statusEl) {
    statusEl.textContent = isCorrect
      ? `Correct! You found ${loc.name}.`
      : `Incorrect. ${loc.name} was inside the colored box.`;
  }

  // Move to next question (or finish) after a short pause
  currentQuestionIndex++;

  if (currentQuestionIndex < QUIZ_LOCATIONS.length) {
    setTimeout(showCurrentQuestion, 2000);
  } else {
    setTimeout(showFinalScore, 2000);
  }
}

// bounds and point check helpers
function makeBounds(center, latOffset, lngOffset) {
  return {
    north: center.lat + latOffset,
    south: center.lat - latOffset,
    east: center.lng + lngOffset,
    west: center.lng - lngOffset,
  };
}

function pointInBounds(latLng, bounds) {
  const lat = latLng.lat();
  const lng = latLng.lng();

  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
}

//------------------------------------------------
// Extra Feature 3: High Score
//------------------------------------------------
function showFinalScore() {
    clearTimer(); // stop the timer

  if (answerRectangle) {
    answerRectangle.setMap(null);
    answerRectangle = null;
  }

  const infoPanel = document.querySelector("#info-panel p");
  const statusEl = byId("status-message");
  const playAgainBtn = byId("play-again");

  // Update text
  if (infoPanel) {
    infoPanel.textContent = "Quiz complete!";
  }

  if (statusEl) {
    statusEl.textContent = `You got ${score} correct out of ${QUIZ_LOCATIONS.length} questions.`;
  }

  // Update high score 
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("csunMapQuizBestScore", String(bestScore));
  }
  updateHighScoreUI();

  // Show the Play again button 
  if (playAgainBtn) {
    playAgainBtn.classList.remove("hidden");
  }
}

// Reset all quiz state and start over
function resetQuiz() {
  // Reset state
  currentQuestionIndex = 0;
  score = 0;

  // Clear any rectangle from previous game
  if (answerRectangle) {
    answerRectangle.setMap(null);
    answerRectangle = null;
  }

  // Clear status text
  const statusEl = byId("status-message");
  if (statusEl) statusEl.textContent = "";

  // Hide the Play again button
  const playAgainBtn = byId("play-again");
  if (playAgainBtn) {
    playAgainBtn.classList.add("hidden");
  }

  // Restart timer if you added one
  if (typeof startQuizTimer === "function") {
    startQuizTimer();
  }

  startTimer();
  // Show the first question again
  showCurrentQuestion();
}

// Expose initMap so the Google Maps script callback can find it
window.initMap = initMap;

//------------------------------------------------
// Extra Feature 2: Play Again Button 
//------------------------------------------------
const playAgainBtn = document.getElementById("play-again");
if (playAgainBtn) {
  playAgainBtn.addEventListener("click", resetQuiz);
}
