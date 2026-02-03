import { requireNativeModule } from 'expo-modules-core';

// This links to the Swift/Kotlin code named "ScreenTimeControl"
const ScreenTimeControl = requireNativeModule('ScreenTimeControl');

/**
 * Asks the user for permission to manage Screen Time / Family Controls.
 * Returns true if authorized, false if denied or failed.
 */
export async function requestAuthorization(): Promise<boolean> {
  try {
    return await ScreenTimeControl.requestAuthorization();
  } catch (e) {
    console.warn("Screen Time Authorization failed:", e);
    return false;
  }
}

/**
 * LOCKS THE DEVICE (Focus Mode).
 * Android: Starts "App Pinning" (Kiosk Mode).
 * iOS: Activates Restriction Shield (requires Extension, stubbed here for MVP).
 */
export async function startRestriction(): Promise<void> {
  try {
    await ScreenTimeControl.startRestriction();
  } catch (e) {
    console.warn("Start Restriction failed:", e);
  }
}

/**
 * UNLOCKS THE DEVICE.
 * Android: Stops App Pinning.
 * iOS: Deactivates Shield.
 */
export async function stopRestriction(): Promise<void> {
  try {
    await ScreenTimeControl.stopRestriction();
  } catch (e) {
    console.warn("Stop Restriction failed:", e);
  }
}

/**
 * Checks if the user has currently authorized the app.
 */
export function isRestricted(): boolean {
  try {
    return ScreenTimeControl.isRestricted();
  } catch (e) {
    return false;
  }
}