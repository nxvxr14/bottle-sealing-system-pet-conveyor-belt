// SYSTEM
const { Board, Sensor } = require("johnny-five");
const board = new Board();

// ARDUINO PIN
const pulsosPin = 2;
const flowPin = 3;
const enableB = 10;
const enableCon = 11;
const inputH4 = 12;
const inputH3 = 13;

// GLOBAL CONST
const waveperL = 5880;
const radio = 6.7526;
const pulse_per_turn = 52;
const kRpm = (2 * Math.PI) / 60;
const kRpmGen = (60 * 1000) / pulse_per_turn;
const tMuestreo = 40;

// VELOCITY VAR
let velFiltered = 0;
let autoincrement = true;
let startTime = 0;
let elapsedTime;
let previousValue = 0;
let previousValue1 = 0;
let valorPWM = 0;
let pulsos = 0;
let rpmGen = 0;
let TIME = Date.now();
let TIME2 = 0;
let TIME3 = 0;
let sp = 0;
let en = 0;
let en_1 = 0;
let I_error = 0;
let I_error_1 = 0;
let dif_act = 0;
let Ad_1 = 0;
let A_d = 0;
let A_p = 0;
let A_i = 0;
let Uc = 0;
let un = 0;

// IR VAR - FIRST STAGE
let oneIR = 0;
let oneIR_f = 0;
let flagStopCon = false;
let flagStarW = false;
let startTime2 = true;
let startTime3 = true;
let flow = 0;
let totalML = 0;
let waterPWM = 0;


// IR FILTER - FIRST STAGE
const fSizeIR = 8;
const oneIRhistory = Array(fSizeIR).fill(0);

// VELOCITY FILTER
const fSizeBanda = 3;
const bandaHistory = Array(fSizeBanda).fill(0);


// ARDUINO CODE 

board.on("ready", () => {
  const firstIR = new Sensor("A0");
  setupArduino();

  firstIR.on("change", () => {
    oneIR = firstIR.value;
    oneIR_f = filterOneIR(oneIR);

  }, tMuestreo);

  board.digitalRead(pulsosPin, (value) => {
    if (value === 1 && previousValue === 0) {
      pulsos++;
      printData();
    }
    previousValue = value;
  });

  board.digitalRead(flowPin, (value1) => {
    if (value1 === 1 && previousValue1 === 0) {
      flow++;
    }
    previousValue1 = value1;
  });


    setInterval(() => {
      console.log(oneIR_f+";"+board.pins[enableB].value + ";"+waterPWM+";"+totalML) ;
      stateWaterP();
      if(flagStopCon == false) motionIR();
      if(flagStopCon == true) fillBottle();


  
    }, tMuestreo);
});




// FUNCTIONS

function fillBottle(){
  if (startTime2 == true) {
    startTime3 = true;
    TIME2 = Date.now();
    startTime2 = false;
  }

  if (Date.now() - TIME2 >= 2000 && flagStopCon == true) {
    console.log("INCIIO") ;

    waterPWM = 80;

}

totalML = (flow / waveperL) * 1000;

if (totalML > 200)  {
  console.log("FIN") ;
  waterPWM = 0;
  if (startTime3 == true) {
    TIME3 = Date.now();
    startTime3 = false;
  }

  if (Date.now() - TIME3 >= 2000 && flagStopCon == true) {
    flagStopCon = false;

  }


}   

}

function motionIR(){

  if(oneIR_f > 860 && oneIR_f < 915 ) {
    console.log("parar") ;

    sp = 0;
    flow = 0;
    totalML = 0;
    startTime2 = true;
    flagStopCon = true;
    resetVar();
  }
  

  if(oneIR_f > 930 ){
    console.log("mover") ;
    waterPWM = 0;
    flagStopCon = false;
sp = 7.5/radio;
controlPID();


  }

}

function stateWaterP(){
  board.analogWrite(enableB, waterPWM);
if (waterPWM < 10){
  board.digitalWrite(inputH3, 0);
  board.digitalWrite(inputH4, 0);

} else{
  board.digitalWrite(inputH3, 1);
  board.digitalWrite(inputH4, 0);
}

}

function controlPID() {
  resetVar();


  let Kp = 4.129839917619998;
  let Ki = 2.32950066190001;
  let Kd = 0.927610016190000;
  let Ka = 0.9;
  let N = 0;

  en = sp - velFiltered;
  A_p = Kp * en;
  A_d = Kd * (en - en_1) + N * Ad_1;
  I_error = en + I_error_1 + Ka * dif_act;
  A_i = Ki * I_error;
  Uc = A_p + A_d + A_i;
  un = Uc;

  if (Uc < 0) {
    un = 0;
  }
  if (Uc > 100) {
    un = 100;
  }
  valorPWM = (un / 100) * 255;
  board.analogWrite(enableCon, valorPWM);

  en_1 = en;
  I_error_1 = I_error;
  dif_act = un - Uc;
  Ad_1 = A_d;
}

function printData() {
  if (Date.now() - TIME >= tMuestreo) {
    rpmGen = (kRpmGen / (Date.now() - TIME)) * pulsos;
    if (rpmGen < 60) velFiltered = filterVel(rpmGen * kRpm);


    if (autoincrement == true && velFiltered < 6) {
      if (startTime == 0) {
        startTime = Date.now();
      }
      elapsedTime = Date.now() - startTime;
      let velFilteredL = velFiltered*radio;
/*
      console.log(
        elapsedTime +
        ";" +
        oneIR +
        ";" +
        oneIR_f +
        ";" +
        rpmGen * kRpm +
        ";" +
        velFiltered 
      );
*/

    }

    TIME = Date.now();
    pulsos = 0;
  }
}

function filterOneIR(value) {
  oneIRhistory.shift();
  oneIRhistory.push(value);

  let sum = 0;
  oneIRhistory.forEach(val => sum += val);
  return sum / fSizeIR;
}

function filterVel(value) {
  bandaHistory.shift();
  bandaHistory.push(value);

  let sum = 0;
  bandaHistory.forEach(val => sum += val);
  return sum / fSizeBanda;
}

function resetVar() {
  if (sp === 0) {
    velFiltered = 0;
    startTime = 0;
    elapsedTime;
    valorPWM = 0;
    pulsos = 0;
    rpmGen = 0;
    en = 0;
    en_1 = 0;
    I_error = 0;
    I_error_1 = 0;
    dif_act = 0;
    Ad_1 = 0;
    A_d = 0;
    A_p = 0;
    A_i = 0;
    Uc = 0;
    un = 0;
    board.analogWrite(enableCon, valorPWM);
    return;
  }
}

function setupArduino() {
  board.pinMode(enableB, board.MODES.PWM);
  board.pinMode(enableCon, board.MODES.PWM);
  board.pinMode(inputH4, board.MODES.OUTPUT);
  board.pinMode(inputH3, board.MODES.OUTPUT);

  board.digitalWrite(inputH3, 1);
  board.digitalWrite(inputH4, 0);

  
  board.pinMode(pulsosPin, board.MODES.INPUT);
  board.pinMode(flowPin, board.MODES.INPUT);
  
}

function openLoop() {
  resetVar();
  if (sp > 100) sp = 100;
  valorPWM = ((sp*radio) / 100) * 255;
  board.analogWrite(enableCon, valorPWM);

}

