#include <FastLED.h>

// --- Dynamic Configuration ---
#define NUM_LEDS 600           // Total number of 5V LEDs
#define FILL_SPEED_MS 8        // Delay between each LED turning on (ms)
#define STAY_ON_MS 2000        // How long LEDs stay on before dimming (ms)
#define DIM_SPEED_MS 5         // Delay between each brightness step during dimming (ms)
#define COOLDOWN_MS 8000       // Total cooldown time before button works again (ms)

// --- Pin Definitions ---
#define DATA_PIN 6             // WS2811 DIN
#define BUTTON_1_PIN 2         // Main trigger button
#define BUTTON_2_PIN 3         // Second button (Placeholder for future use)
#define RELAY_PIN 4            // 220V Relay control pin

CRGB leds[NUM_LEDS];
unsigned long lastTriggerTime = 0;
bool isCoolingDown = false;

void setup() {
  FastLED.addLeds<WS2811, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(255);
  FastLED.clear();
  FastLED.show();

  pinMode(BUTTON_1_PIN, INPUT_PULLUP);
  pinMode(BUTTON_2_PIN, INPUT_PULLUP);
  
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Set to HIGH if your relay is active-low
}

void loop() {
  // Check if cooldown period has passed
  if (isCoolingDown && (millis() - lastTriggerTime >= COOLDOWN_MS)) {
    isCoolingDown = false;
  }

  // If button 1 is pressed AND we are not in a cooldown
  if (digitalRead(BUTTON_1_PIN) == LOW && !isCoolingDown) {
    
    lastTriggerTime = millis(); // Start cooldown timer
    isCoolingDown = true;
    
    runLightSequence();
  }
}

// --- Sequence Logic ---
void runLightSequence() {
  FastLED.setBrightness(255); // Ensure brightness is reset
  
  // 1. Fill LEDs one by one
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CRGB::White;
    FastLED.show();
    delay(FILL_SPEED_MS);
  }

  // 2. Turn on 220V LED Strip via Relay
  digitalWrite(RELAY_PIN, HIGH); // Change to LOW if relay is active-low

  // 3. Wait for the specified time
  delay(STAY_ON_MS);

  // 4. Turn off 220V LED Strip
  digitalWrite(RELAY_PIN, LOW); // Change to HIGH if relay is active-low

  // 5. Dim the 5V LEDs to 0
  for (int b = 255; b >= 0; b--) {
    FastLED.setBrightness(b);
    FastLED.show();
    delay(DIM_SPEED_MS);
  }

  // 6. Clear data for the next run
  FastLED.clear();
  FastLED.show();
}