const { Board, Servo } = require("johnny-five");

const arduino2 = "/dev/tty.usbmodem14101"; 
const board = new Board({ port: arduino2 });


board.on("ready", () => {
  const servoCoiled = new Servo(9);  // Inicializar el servo
  const enableWater = 10;
  const enableCon = 3;
  const turnMotor = 5;
  const inputH4 = 12;
const inputH3 = 13;

  board.pinMode(turnMotor, board.MODES.PWM);
  board.pinMode(enableWater, board.MODES.PWM);
  board.pinMode(enableCon, board.MODES.PWM);
  board.pinMode(inputH4, board.MODES.OUTPUT);
  board.pinMode(inputH3, board.MODES.OUTPUT);

  //board.digitalWrite(inputH3, 1);
  //oard.digitalWrite(inputH4, 0);

  //board.analogWrite(turnMotor, 100); // Prueba de escritura PWM
  //board.analogWrite(enableWater, 100); // Prueba de escritura PWM
  board.analogWrite(enableCon, 50); // Prueba de escritura PWM

  setInterval(() => {
    servoCoiled.to(130);

    }, 150);
});

board.on("error", (err) => {
  console.log(err);
});


/*

const { Board, Pin } = require("johnny-five");
const board = new Board();

board.on("ready", () => {
  const servoPin = new Pin(9);
  
  // Función para escribir un valor PWM en el pin del servo
  function writePWM(value) {
    servoPin.analogWrite(value);
  }

  // Mover el servo a 140 grados (ejemplo)
  function moveServoTo(angle) {
    // Asumiendo una conversión directa de ángulo a valor PWM para el servo
    const pwmValue = Math.round((angle / 180) * 255);
    writePWM(pwmValue);
  }

  // Mover el servo a 140 grados
  moveServoTo(140);

  // Puedes ajustar el ángulo y la duración según sea necesario
});

*/