#include <lmic.h>
#include <hal/hal.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GPS.h>
#include <Adafruit_LIS3DH.h>

// Define GPS object
Adafruit_GPS GPS(&Serial1);

// Used for software SPI
#define LIS3DH_CLK 13
#define LIS3DH_MISO 12
#define LIS3DH_MOSI 11

// Used for hardware & software SPI
#define LIS3DH_CS 10

unsigned long gps_timer = millis();

const int taskDelay = 1000;

// TTN Configuration
static const u1_t PROGMEM APPEUI[8] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
void os_getArtEui(u1_t* buf) { memcpy_P(buf, APPEUI, 8); }

// This should also be in little endian format, see above.
static const u1_t PROGMEM DEVEUI[8] = { 0xB4, 0x34, 0x06, 0xD0, 0x7E, 0xD5, 0xB3, 0x70 };
void os_getDevEui(u1_t* buf) { memcpy_P(buf, DEVEUI, 8); }

// This key should be in big endian format
static const u1_t PROGMEM APPKEY[16] = { 0x38, 0x2E, 0xCD, 0x7F, 0x9C, 0x6B, 0x71, 0xE3, 0xA8, 0xA6, 0xF0, 0xDE, 0x1D, 0xF1, 0xDE, 0x18 };
void os_getDevKey(u1_t* buf) { memcpy_P(buf, APPKEY, 16); }

const int bufferSize = 16;
static uint8_t gpsData[bufferSize * 3]; // Buffer for storing GPS data (latitude, longitude, time)
int currentIndex = 0; // Current index in the buffer
static osjob_t sendjob;

// Schedule TX every this many seconds
const unsigned TX_INTERVAL = 10;

// Pin mapping for Adafruit Feather M0 LoRa
const lmic_pinmap lmic_pins = {
  .nss = 8,
  .rxtx = LMIC_UNUSED_PIN,
  .rst = 4,
  .dio = {3, 6, LMIC_UNUSED_PIN},
  .rxtx_rx_active = 0,
  .rssi_cal = 8,
  .spi_freq = 8000000,
};

void setup() {
  // put your setup code here, to run once:
  delay(1000);
  while (!Serial);
  Serial.begin(115200);

  // GPS Setup
  GPS.begin(115200);
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);

  Wire.begin();

  // LMIC init.
  os_init();
  LMIC_reset();
  LMIC_setLinkCheckMode(0);
  LMIC_setDrTxpow(DR_SF7, 14);

  do_send(&sendjob);
}

void loop() {
  os_runloop_once();

  if (millis() - gps_timer > taskDelay) {
    buildPayload();
  }
}

void onEvent (ev_t ev) {
  switch(ev) {
    case EV_SCAN_TIMEOUT:
      Serial.println(F("EV_SCAN_TIMEOUT"));
      break;
    case EV_BEACON_FOUND:
      Serial.println(F("EV_BEACON_FOUND"));
      break;
    case EV_BEACON_MISSED:
      Serial.println(F("EV_BEACON_MISSED"));
      break;
    case EV_BEACON_TRACKED:
      Serial.println(F("EV_BEACON_TRACKED"));
      break;
    case EV_JOINING:
      Serial.println(F("EV_JOINING"));
      break;
    case EV_JOINED:
      Serial.println(F("EV_JOINED"));
      LMIC_setLinkCheckMode(0);
      break;
    case EV_JOIN_FAILED:
      Serial.println(F("EV_JOIN_FAILED"));
      break;
    case EV_REJOIN_FAILED:
      Serial.println(F("EV_REJOIN_FAILED"));
      break;
    case EV_TXCOMPLETE:            
      Serial.println(F("Payload sent successfully"));
      // Schedule next transmission
      os_setTimedCallback(&sendjob, os_getTime()+sec2osticks(TX_INTERVAL), do_send);
      break;
    case EV_LOST_TSYNC:
      Serial.println(F("EV_LOST_TSYNC"));
      break;
    case EV_RESET:
      Serial.println(F("EV_RESET"));
      break;
    case EV_RXCOMPLETE:
      // data received in ping slot
      Serial.println(F("EV_RXCOMPLETE"));
      break;
    case EV_LINK_DEAD:
      Serial.println(F("EV_LINK_DEAD"));
      break;
    case EV_LINK_ALIVE:
      Serial.println(F("EV_LINK_ALIVE"));
      break;
    case EV_TXSTART:
      Serial.println(F("Starting new transmission"));
      break;
    default:
      Serial.print(F("ERROR: Unknown event "));
      Serial.println(ev);
      break;
  }
}

void do_send(osjob_t* j) {
  // Check if there is not a current TX/RX job running
  if (LMIC.opmode & OP_TXRXPEND) {
    Serial.println(F("OP_TXRXPEND, not sending"));
  } else {
    // prepare upstream data transmission
    LMIC_setTxData2(1, gpsData, sizeof(gpsData) - 1, 0);
  }
  // Next TX is scheduled after TX_COMPLETE event.
}

void buildPayload() {
  // Read GPS data
  if (GPS.newNMEAreceived()) {
    if (GPS.parse(GPS.lastNMEA())) {
      // Store GPS data in the buffer
      gpsData[currentIndex] = GPS.latitudeDegrees;
      gpsData[currentIndex + bufferSize] = GPS.longitudeDegrees;
      gpsData[currentIndex + bufferSize * 2] = GPS.seconds;

      // Display GPS data (optional)
      Serial.print("Latitude: ");
      Serial.print(GPS.latitudeDegrees, 4);
      Serial.print(", Longitude: ");
      Serial.print(GPS.longitudeDegrees, 4);
      Serial.print(", Time: ");
      Serial.print(GPS.seconds);
      Serial.println();

      currentIndex = (currentIndex + 1) % bufferSize;
      gps_timer = millis();
    }
  }
}

