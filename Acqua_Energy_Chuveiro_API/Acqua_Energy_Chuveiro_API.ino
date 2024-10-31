#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "GabrielRodrigues";        // Substitua pelo nome da sua rede Wi-Fi
const char* password = "19092005";   // Substitua pela senha da sua rede Wi-Fi
const char* serverUrl = "http://192.168.254.26:3000/api/dados";  // URL da API (substitua <seu_ip> pelo IP do servidor)

const int triggerPin = 27;  // Pino do trigger do sensor ultrassônico
const int echoPin = 26;     // Pino do echo do sensor ultrassônico
const int ledVermelho = 32; // Pino do LED vermelho
const int ledVerde = 33;    // Pino do LED verde

unsigned long tempoAnterior = 0;  // Armazena o tempo anterior
unsigned long intervalo = 1000;   // Intervalo de 1 segundo
int segundos = 0;                 // Contador de segundos
long distancia;                   // Armazena a distância medida
unsigned long tempoSemUso = 0;    // Tempo que o chuveiro está desligado
const int tempoParaZerar = 5000;  // Tempo para zerar o contador (5 segundos de ausência)
bool algoDetectado = false;       // Estado de detecção
bool estadoLedVerde = LOW;        // Estado atual do LED verde (para piscar)


void setup() {
  Serial.begin(115200);

  // Configura os pinos
  pinMode(triggerPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledVermelho, OUTPUT);
  pinMode(ledVerde, OUTPUT);

  // Conectar ao Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado ao Wi-Fi!");
}

// Função para enviar dados para a API
void enviarDadosAPI(int tempoUso) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Constrói o JSON com o tempo de uso
    String payload = "{\"tempo_uso\":" + String(tempoUso) + "}";
    
    // Envia o POST com o tempo de uso
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      String resposta = http.getString();
      Serial.println("Resposta da API: " + resposta);
    } else {
      Serial.println("Erro ao enviar dados: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("Wi-Fi desconectado.");
  }
}

void loop() {
  // Envia um pulso de 10 microsegundos para o trigger
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);

  // Lê o tempo que o pulso levou para retornar
  long duracao = pulseIn(echoPin, HIGH);
  // Calcula a distância em centímetros
  distancia = duracao * 0.034 / 2;

  unsigned long tempoAtual = millis();  // Obtém o tempo atual

  // Verifica se a distância está abaixo de um valor (ex: 40 cm)
  if (distancia < 30 && distancia > 0) {  // Evita valores negativos e fora do alcance
    // Verifica se já passou 1 segundo
    if (tempoAtual - tempoAnterior >= intervalo) {
      tempoAnterior = tempoAtual;  // Atualiza o tempo anterior
      segundos++;  // Incrementa o contador de segundos

      // Exibe o tempo que o chuveiro esteve em uso no monitor serial
      Serial.println(segundos);
      enviarDadosAPI(segundos);

      // Pisca o LED verde a cada segundo
      estadoLedVerde = !estadoLedVerde;
      digitalWrite(ledVerde, estadoLedVerde);
    }

    // Reseta o tempo que o sensor está sem uso, já que detectou algo
    tempoSemUso = millis();
    algoDetectado = true;  // Algo foi detectado

    // Desliga o LED vermelho (quando algo for detectado)
    digitalWrite(ledVermelho, LOW);
  } 
  else {
    // Se passar até 5 segundos sem detecção
    if (millis() - tempoSemUso < tempoParaZerar) {
      // LED verde fica ligado continuamente, sem piscar
      digitalWrite(ledVerde, HIGH);
    } 
    // Se passar mais de 5 segundos sem detecção
    else if (millis() - tempoSemUso >= tempoParaZerar) {
      algoDetectado = false;  // Marca que não há detecção ativa

      // Liga o LED vermelho e desliga o LED verde após 5 segundos de ausência
      digitalWrite(ledVerde, LOW);
      digitalWrite(ledVermelho, HIGH);

      // Zera o contador de segundos
      segundos = 0;
    }
  }
}
