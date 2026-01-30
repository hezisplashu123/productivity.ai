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
 * Checks if the user has currently authorized the app.
 */
export function isRestricted(): boolean {
  try {
    return ScreenTimeControl.isRestricted();
  } catch (e) {
    return false;
  }
}