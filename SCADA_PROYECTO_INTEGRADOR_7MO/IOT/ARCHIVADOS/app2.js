const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Board, Button, Servo } = require("johnny-five");

// ARDUINO PIN
const board = new Board();
const pulsosPin = 2;
const enableCon = 3;
const flowPin = 8;
const enableWater = 10;
const inputH4 = 12;
const inputH3 = 13;
const turnMotor = 5;

// GLOBAL CONST
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
//const waveperL = 5880;
const waveperL = 5193;
const radio = 6.7526;
const pulse_per_turn = 52;
const kRpm = (2 * Math.PI) / 60;
const kRpmGen = (60 * 1000) / pulse_per_turn;
const tMuestreo = 40;
const tvelMuestreo = 60;
const volFill = 250;
const radioTank = 19.66846825;

// VELOCITY VAR
let velFiltered = 0;
let velFilteredL = 0;
let startTime = 0;
let elapsedTime;
let previousValue = 0;
let previousValue1 = 0;
let convePWM = 0;
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
let oneIR = true;
let flagStopCon = false;
let startTime2 = true;
let startTime3 = true;
let flow = 0;
let localML = 0;
let totalML = 0;
let waterPWM = 0;
let flowRateInstant = 0;

// THIRD STAGE
let servoCoiled;
let flagStopConvEn = false;
let startTime4 = true;
let startTime5 = true;
let TIME4 = 0;

// GLOBAL VAR
let countBottle = 0;
let isRunning = false;
let intervalProcess = null;
let intervalDataStream = null;
let volTank = 0;


// IR FILTER - FIRST STAGE
const fSizeIR = 8;
const oneIRhisfry = Array(fSizeIR).fill(0);

// VELOCITY FILTER
const fSizeBanda = 3;
const bandaHistory = Array(fSizeBanda).fill(0);

// ARDUINO CODE 
board.on("ready", () => {
  const firstIR = new Button(4);
  const thirdIR = new Button(7);
  setupArduino();

  thirdIR.on("release", () => {
    if(!flagStopConvEn) {
        flagStopConvEn = true;
    }
});

  firstIR.on("press", () => {
    oneIR = true;
  });


  firstIR.on("release", () => {
    oneIR = false;
  });

  board.digitalRead(pulsosPin, (value) => {
    printData();
    if (value === 1 && previousValue === 0) {
      pulsos++;
    }
    previousValue = value;
  });

  board.digitalRead(flowPin, (value1) => {
    if (value1 === 1 && previousValue1 === 0) {
      flow++;
    }
    previousValue1 = value1;
  });

  io.on('connection', (socket) => {
    socket.on('start', () => {
      if (!isRunning) {
        isRunning = true;
        intervalProcess = setInterval(() => {
          stateWaterP();
          velConvePID();
          if (!flagStopCon) motionIR();
          if (flagStopCon && !flagStopConvEn) fillBottle(); 
          if (flagStopCon) coiledBottle();
        }, tMuestreo);

        intervalDataStream = setInterval(() => {
            if (startTime == 0) {
                startTime = Date.now();
              }
              elapsedTime = Date.now() - startTime;

            console.log(flagStopConvEn  +";" + flagStopCon + ";"+oneIR);
            io.emit('data', {
                elapsedTime,
                velFilteredL,
                localML,
                totalML, 
                countBottle, 
                convePWM 
              });
          }, 150);
      }
    });

    socket.on('stop', () => {
      if (isRunning) {
        resetFirstStage();
      }
    });


  });


});

// FUNCTIONS

function coiledBottle(){
  if (startTime4) {
    startTime5 = true;
    TIME4 = Date.now();
    startTime4 = false;
  }

  if (Date.now() - TIME4 >= 2000 && flagStopConvEn ) {
    board.analogWrite(turnMotor, 100);

  }

  if (Date.now() - TIME4 >= 10000 && flagStopConvEn) {
    board.analogWrite(turnMotor, 0);
    flagStopCon = false;
    flagStopConvEn = false;

  }
}

function stateWaterP() {
  board.analogWrite(enableWater, waterPWM);
  if (waterPWM < 10) {
    board.digitalWrite(inputH3, 0);
    board.digitalWrite(inputH4, 0);
  } else {
    board.digitalWrite(inputH3, 1);
    board.digitalWrite(inputH4, 0);
  }
}

function fillBottle() {
  if (startTime2) {
    startTime3 = true;
    TIME2 = Date.now();
    startTime2 = false;
  }

  if (Date.now() - TIME2 >= 2000 && flagStopCon && !flagStopConvEn ) {
    waterPWM = 200; // ENCENDER BOMBA
  }

  localML = (flow / waveperL) * 1000;
  flowRateInstant = (localML / (Date.now() - TIME2))*1000;

  if (localML > volFill) {
    waterPWM = 0;
    if (startTime3) {
      TIME3 = Date.now();
      startTime3 = false;
    }

    if (Date.now() - TIME3 >= 2000 && flagStopCon) {
      flagStopCon = false;
      totalML = totalML + localML;
      countBottle++;
    }
  }
}


function motionIR() {
  if (!oneIR ) {
    //console.log("parar");
    sp = 0;
    startTime2 = true;
    flagStopCon = true;
    resetConvePID();
  }

  if (oneIR) {
    //console.log("mover");
    waterPWM = 0;
    flagStopCon = false;
    sp = 7 / radio;
    flow = 0;
    localML = 0;
  }

  if(flagStopConvEn){
    console.log("entre");
    sp = 0;
    startTime4 = true;
    flagStopCon = true;
    resetConvePID();

  }
}

function velConvePID() {
resetConvePID();
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
  convePWM = (un / 100) * 255;
  board.analogWrite(enableCon, convePWM);

  en_1 = en;
  I_error_1 = I_error;
  dif_act = un - Uc;
  Ad_1 = A_d;
}

function printData() {
  if (Date.now() - TIME >= tvelMuestreo) {
    rpmGen = (kRpmGen / (Date.now() - TIME)) * pulsos;
    if (rpmGen < 60) velFiltered = filterVel(rpmGen * kRpm);
    if (velFiltered < 6) velFilteredL = velFiltered * radio;
    TIME = Date.now();
    pulsos = 0;
  }
}

function filterVel(value) {
  bandaHistory.shift();
  bandaHistory.push(value);

  let sum = 0;
  bandaHistory.forEach(val => sum += val);
  return sum / fSizeBanda;
}

function resetConvePID() {
  if (sp === 0) {
    velFiltered = 0;
    velFilteredL = 0;
    convePWM = 0;
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
    board.analogWrite(enableCon, convePWM);
  }
}

function resetFirstStage(){
    sp = 0;
    totalML = 0;
    countBottle = 0;
    elapsedTime = 0;
    startTime = 0;
    velFilteredL = 0;
    resetConvePID();
    clearInterval(intervalProcess);
    clearInterval(intervalDataStream);

    isRunning = false;
    intervalProcess = null;
    intervalDataStream = null;
}

function setupArduino() {
  board.pinMode(turnMotor, board.MODES.PWM);
  board.pinMode(enableWater, board.MODES.PWM);
  board.pinMode(enableCon, board.MODES.PWM);

  board.pinMode(inputH4, board.MODES.OUTPUT);
  board.pinMode(inputH3, board.MODES.OUTPUT);

  board.digitalWrite(inputH3, 1);
  board.digitalWrite(inputH4, 0);


  board.pinMode(pulsosPin, board.MODES.INPUT);
  board.pinMode(flowPin, board.MODES.INPUT);
}

server.listen(3000, () => {
  console.log('Servidor escuchando en el puerto 3000');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
