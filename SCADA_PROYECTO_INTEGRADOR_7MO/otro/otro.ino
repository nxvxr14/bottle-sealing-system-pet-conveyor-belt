#include "MeanFilterLib.h"

/*
 30% 17.39 mls/s
 40% 22.42 ml/s
 50% 23.8 ml/s
 60% 23.92 ml/s
 70% 
 
  
  */

MeanFilter<float> filter(8);
int entrada3 = 13;
int entrada4 = 12;
int enableB = 10;
int banda = 11;
int maxPWM = 220;
unsigned long timeold = 0;

const int flowPulse = 8; // Definir el pin al que está conectado el sensor de pulsos

volatile unsigned int flow = 0;

float waveperL = 5880;
float totalML = 0;



void setup() {
  Serial.begin(9600);


  pinMode(flowPulse, INPUT); // Configurar el pin como entrada
  attachInterrupt(digitalPinToInterrupt(flowPulse), flowRate, RISING); // Adjuntar la interrupción al pin para contar los pulsos

}


void loop() {
//    int valor = 100;
//    int sensorValue = analogRead(A0);
//    int filtrado = filter.AddValue(sensorValue);
//    Serial.print(sensorValue ); Serial.print(", "); Serial.print(filtrado); Serial.print("\n");
//    if(filtrado > 959) analogWrite(banda, map(20, 0, 100, 0, maxPWM));
//    if(filtrado < 961) analogWrite(banda, map(0, 0, 100, 0, maxPWM));

  if (millis() - timeold >= 250) {
    timeold = millis();
    // Mostrar la cantidad de litros en el puerto serie
    Serial.print("Cantidad de litros: ");
      totalML = (flow / waveperL)*1000;
      
    Serial.println(totalML);

  }

  //analogWrite(enableB, map(100, 0, 100, 0, maxPWM));


}

void flowRate() {
  flow++; // Incrementar el contador de pulsos


}
