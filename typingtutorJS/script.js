$(document).ready(function() {

    $.ajax({url: "article.json", success: function(result){
    let number = Math.floor((Math.random() * result.length) );
    para = result[number][0] ;
   document.querySelector("#origin-text p").innerHTML = result[number][1] ;
   originText = document.querySelector("#origin-text p").innerHTML;
   displayHighestScore();
  }});


var para
var event ;
var originText; 
const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");
const minTime = document.querySelector(".min_time");
const debug = document.querySelector("#debug"); //enabling paste


var timer = [0,0,0,0];
var interval;
var timerRunning = false;

// Add leading zero to numbers 9 or below (purely for aesthetics):
function leadingZero(time) {
    if (time <= 9) {
        time = "0" + time;
    }
    return time;
}

// Run a standard minute/second/hundredths timer:
function runTimer() {

    timer[3]++;
    timer[0] = Math.floor((timer[3]/100)/60);
    timer[1] = Math.floor((timer[3]/100) - (timer[0] * 60));
    timer[2] = Math.floor(timer[3] - (timer[1] * 100) - (timer[0] * 6000));

    currentTime = leadingZero(timer[0]) + ":" + leadingZero(timer[1]) + ":" + leadingZero(timer[2]);
    theTimer.innerHTML = currentTime;

}

// Match the text entered with the provided text on the page:
function spellCheck() {
    let textEntered = testArea.value;
    let originTextMatch = originText.substring(0,textEntered.length);


    if (textEntered == originText) {
        clearInterval(interval);
        setMinimumTime();
        testWrapper.style.borderColor = "#429890";
    } else {
        if (textEntered == originTextMatch) {
            testWrapper.style.borderColor = "#65CCf3";
        } else {
            testWrapper.style.borderColor = "#E95D0F";
        }
    }

}

// Start the timer:
function start() {
    let textEnterdLength = testArea.value.length;
    if (textEnterdLength === 0 && !timerRunning) {
        timerRunning = true;
        interval = setInterval(runTimer, 10);
    }
   // console.log(textEnterdLength);
}

// Reset everything:
function reset() {
    clearInterval(interval);
    interval = null;
    timer = [0,0,0,0];
    timerRunning = false;

    testArea.value = "";
    theTimer.innerHTML = "00:00:00";
    testWrapper.style.borderColor = "grey";
}

// Event listeners for paraboard input and the reset
function enablePaste() {
    testArea.removeEventListener("paste", event);
}


testArea.addEventListener("paradown", start, false);
testArea.addEventListener("paraup", spellCheck, false);
testArea.addEventListener("paste", event =  e => e.preventDefault(), false);
resetButton.addEventListener("click", reset, false);
debug.addEventListener("click", enablePaste, false);


//sets minimum time 
function setMinimumTime(){
    
    if(localStorage.getItem(para)!= null){

        let score = JSON.parse(localStorage.getItem(para)) ; 

        if ((timer[0]-score["min"])*6000+(timer[1]-score["sec"])*100+(timer[2]-score["mili"])< 0 && timer[0]+timer[1]+timer[2] !==0) {
            
              score = {
                    "min": timer[0],
                    "sec": timer[1],
                    "mili": timer[2]
                }

            localStorage.setItem(para, JSON.stringify(score));
        }
    }
    else {

        if(timer[0]+timer[1]+timer[2] !==0){
        score = {
                    "min": timer[0],
                    "sec": timer[1],
                    "mili": timer[2]
                }
            localStorage.setItem(para, JSON.stringify(score));
}
}
}

//display minimum ime till now 
function displayHighestScore() {
if(localStorage.getItem(para)!= null){
var min_time = JSON.parse(localStorage.getItem(para));
min_time = leadingZero(min_time["min"]) + ":" + leadingZero(min_time["sec"]) + ":" + leadingZero(min_time["mili"]);
    minTime.innerHTML = `Minimum Time : ${min_time}`;
}
else minTime.innerHTML = 'Start the game !!';
}

});