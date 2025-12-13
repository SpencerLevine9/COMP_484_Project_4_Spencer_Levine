// COMP 484 – Project 4 – Google Maps Quiz
// Spencer Levine

let map; 
let currentQuestionIndex = 0;
let score = 0; // how many questions user got right
let answerRectangles= []; // store ALL rectangles so that each answered question stays visible

  // Custom styles to hide street names and point-of-interest markers
const MAP_STYLES = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

//------------------------------------------------
// Extra Feature 1 & 3: Timer and High Score
//------------------------------------------------
let timerId = null; // Stores the ID of the timer interval so we can stop the timer later.
let timeLeft = 0; // Stores how many seconds remain on the countdown.

// high score stored in localStorage
let bestScore = 0; // best score across sessions
const BEST_SCORE_KEY = "csunMapQuizBestScore"; // key for localStorage

// Load stored best score (if any)
const storedBest = Number(localStorage.getItem("csunMapQuizBestScore")); // retrieve from localStorage
if (!Number.isNaN(storedBest)) { // check if it's a valid number
  bestScore = storedBest; // set best score
}

// Update the Best score
function updateHighScoreUI() {
  const highScoreEl = document.getElementById("high-score"); // get the high score element
  if (!highScoreEl) return;  // safety check

  highScoreEl.textContent = `Best score: ${bestScore} / ${QUIZ_LOCATIONS.length}`; // update text
}

function updateTimerDisplay() {
  const timerEl = document.getElementById("timer"); // get the timer element
  if (!timerEl) return;  // safety check
  timerEl.textContent = `Time left: ${timeLeft}s`; // update text
}

function updateHighScoreDisplay() {
  const highScoreEl = document.getElementById("high-score");  // get the high score element
  if (!highScoreEl) return; // safety check
  highScoreEl.textContent = `Best score: ${bestScore} / ${QUIZ_LOCATIONS.length}`; // update text
}

function loadBestScore() {
  const saved = localStorage.getItem(BEST_SCORE_KEY); // get saved best score
  if (saved !== null) {  // if it exists
    const parsed = Number(saved);  // parse it
    if (!Number.isNaN(parsed)) {  // check if it's a valid number
      bestScore = parsed;  // set best score
    }
  }
  updateHighScoreDisplay();  // update UI
}

function saveBestScore() {
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));  // save best score to localStorage
}

//------------------------------------------------
// Extra Feature 1: Timer
//------------------------------------------------
function clearTimer() {
  if (timerId !== null) {   // if timer is running
    clearInterval(timerId);  // stop the timer
    timerId = null; // reset timer ID
  }
}

function startTimer() {
  clearTimer(); // ensure no previous timer is running
  timeLeft = 120;              // 120 seconds = 2 minutes
  updateTimerDisplay();  // initial display update

  timerId = window.setInterval(() => { // start interval
    timeLeft--; // decrement time
    updateTimerDisplay(); // update display

    if (timeLeft <= 0) { // time's up
      timeLeft = 0; // ensure it doesn't go negative
      updateTimerDisplay(); // final display update
      clearTimer(); // stop the timer
      showFinalScore("Time is up!"); // show final score
    }
  }, 1000); // every second
}
// end of extra feature code

// quiiz locations 
// buildings with the real coordinates from Google Maps.
const QUIZ_LOCATIONS = [
  {
    name: "Chicano House",
    center: { lat: 34.24254471334635, lng: -118.52993979462777 }, // your existing coordinates
    grid: "D5",
  },
  {
    name: "Jacaranda Hall",
    center: { lat: 34.24117170635642, lng: -118.52893500416396 }, 
    grid: "E6",                               
  },
  {
    name: "University Library",
    center: { lat: 34.24004442624334, lng: -118.52931503437752 }, 
    grid: "F5",
  },
  {
    name: "Student Recreation Center (SRC)",
    center: { lat: 34.240010526482784, lng: -118.52494668431943 }, 
    grid: "G4",
  },
  {
    name: "Autodesk Technology Engagement Center",
    center: { lat: 34.24158829209471, lng: -118.5277221942389 }, 
    grid: "D5",
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
  currentQuestionIndex = 0; // start at first question
  score = 0;  // reset score

  // hide play again button if visible
  const playAgainBtn = document.getElementById("play-again");  // get the button
  if (playAgainBtn) {  // safety check
    playAgainBtn.classList.add("hidden");  // hide it
  }

  const statusEl = document.getElementById("status-message");   // get status message element
  if (statusEl) statusEl.textContent = "";  // clear any previous text

  // create the map
  map = new google.maps.Map(document.getElementById("map"), {  // map container
    center: { lat: 34.24, lng: -118.53 }, // nice campus overview
    zoom: 16.51,
    mapTypeId: "roadmap",  // standard roadmap view
    draggable: false,  
    scrollwheel: false,
    disableDoubleClickZoom: true,
    keyboardShortcuts: false,
    zoomControl: false,
    fullscreenControl: false, // disable full-screen view
    streetViewControl: false, // disable Pegman / street view
    panControl: false,    // disable panning control
    mapTypeControl: false,  // disable map type control
    disableDefaultUI: true, // disable all default UI
    styles: MAP_STYLES,       // hide street names & markers
  });

  // listen for guesses
  map.addListener("dblclick", handleMapDoubleClick);  // double-click handler

  // first question & timer
  showCurrentQuestion();  // display first question
  startTimer(); // start the timer
}

// show the current question
function showCurrentQuestion() {  
  const loc = QUIZ_LOCATIONS[currentQuestionIndex];  // get current location

  const infoPanel = document.querySelector("#info-panel p");  // info panel paragraph
  if (infoPanel) {  // safety check
    infoPanel.textContent = `${loc.name} is one of the CSUN buildings on campus.`;  // update text
  }

  // Status message shows instructions
  const statusEl = byId("status-message");  // get status message element
  if (statusEl) {
    statusEl.textContent =  // update status text
      `Question ${currentQuestionIndex + 1} of ${QUIZ_LOCATIONS.length}: ` +  // question number
      `Double-click on the map where you think ${loc.name} is located.`;  // update text
  }
    // Update the big page title to show the current building and its grid
  const pageTitle = byId("page-title");
  if (pageTitle) {
    pageTitle.textContent = `CSUN Map – ${loc.name} (${loc.grid})`;
  }
}

// double click handler
function handleMapDoubleClick(event) {
  const clickLatLng = event.latLng;  // get clicked location
  const loc = QUIZ_LOCATIONS[currentQuestionIndex];  // current quiz location

  // Build a small rectangle around the correct building
  // You can tweak 0.0005 to make the box bigger/smaller
  const bounds = makeBounds(loc.center, 0.0005, 0.0005);  // create bounds

  const isCorrect = pointInBounds(clickLatLng, bounds);  // check if guess is correct

  // Green if correct, red if wrong
  const rectColor = isCorrect ? "#00b894" : "#d63031";  

  const rect = new google.maps.Rectangle({  // create rectangle
    bounds,  // set bounds
    map,    // add to map
    strokeColor: rectColor, // border color
    strokeOpacity: 0.9,   // border opacity
    strokeWeight: 2,    // border width
    fillColor: rectColor, // fill color
    fillOpacity: 0.15,    // fill opacity
  });

  answerRectangles.push(rect);  // keep track of every rectangle we draw

  if (isCorrect) {    // if the guess was correct
    score++;  // increment score
  }

  const statusEl = byId("status-message");
  if (statusEl) { // safety check
    statusEl.textContent = isCorrect  // update status text
      ? `Correct! You found ${loc.name}.` // correct message
      : `Incorrect. ${loc.name} was inside the colored box.`; // incorrect message
  }

  // Move to next question (or finish) after a short pause
  currentQuestionIndex++; 

  if (currentQuestionIndex < QUIZ_LOCATIONS.length) {
    setTimeout(showCurrentQuestion, 2000);  // show next question after 2 seconds
  } else {
    setTimeout(showFinalScore, 2000); // show final score after 2 seconds
  }
}

// bounds and point check helpers
function makeBounds(center, latOffset, lngOffset) { // create bounds around center
  return {
    north: center.lat + latOffset,  // top edge
    south: center.lat - latOffset,  // bottom edge
    east: center.lng + lngOffset, // right edge
    west: center.lng - lngOffset, // left edge  
  };
}

function pointInBounds(latLng, bounds) {
  const lat = latLng.lat();   // get latitude
  const lng = latLng.lng();   // get longitude

  return (
    lat <= bounds.north &&    // check north
    lat >= bounds.south &&    // check south
    lng <= bounds.east &&   // check east
    lng >= bounds.west    // check west
  );
}

//------------------------------------------------
// Extra Feature 3: High Score
//------------------------------------------------
function showFinalScore() {
  clearTimer(); // stop the timer

  const infoPanel = document.querySelector("#info-panel p");    // info panel paragraph
  const statusEl = byId("status-message");    // status message element
  const playAgainBtn = byId("play-again");    // play again button

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

  // Clear all rectangles from previous game
  if (answerRectangles.length > 0) {
    answerRectangles.forEach(rect => rect.setMap(null));
    answerRectangles = [];
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
