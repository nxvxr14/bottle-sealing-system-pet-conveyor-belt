const { Board, Servo } = require("johnny-five");

// Reemplaza estos valores con los nombres de puerto correctos
const port1 = "/dev/tty.usbmodem14101";
const port2 = "/dev/tty.usbmodem14201"; // Ajusta este puerto al de tu segundo Arduino

const board1 = new Board({ port: port1 });
const board2 = new Board({ port: port2 });

board1.on("ready", () => {
  console.log(`Board1 is ready on port: ${port1}`);
  
  // Configuración y lógica para el primer Arduino
  const enableWater = 10;
  const enableCon = 3;
  const turnMotor = 5;
  const inputH4 = 12;
  const inputH3 = 13;

  board1.pinMode(turnMotor, board1.MODES.PWM);
  board1.pinMode(enableWater, board1.MODES.PWM);
  board1.pinMode(enableCon, board1.MODES.PWM);
  board1.pinMode(inputH4, board1.MODES.OUTPUT);
  board1.pinMode(inputH3, board1.MODES.OUTPUT);

  board1.digitalWrite(inputH3, 1);
  board1.digitalWrite(inputH4, 0);

  board1.analogWrite(turnMotor, 50); // Prueba de escritura PWM
  //board1.analogWrite(enableWater, 100); // Prueba de escritura PWM
  board1.analogWrite(enableCon, 50); // Prueba de escritura PWM
});

board2.on("ready", () => {
  console.log(`Board2 is ready on port: ${port2}`);
  
  try {
    // Configuración y lógica para el segundo Arduino
    const servoPin = 9;
    
    board2.pinMode(servoPin, board2.MODES.SERVO);
    const servoCoiled = new Servo({
      pin: servoPin,
      board: board2
    });
    
    servoCoiled.to(140);
  } catch (error) {
    console.error(`Error initializing Servo on Board2: ${error.message}`);
  }
});

board1.on("error", (error) => {
  console.error(`Error on Board1: ${error.message}`);
});

board2.on("error", (error) => {
  console.error(`Error on Board2: ${error.message}`);
});
