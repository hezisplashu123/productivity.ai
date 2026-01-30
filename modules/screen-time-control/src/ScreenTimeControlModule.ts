import { NativeModule, requireNativeModule } from 'expo';

import { ScreenTimeControlModuleEvents } from './ScreenTimeControl.types';

declare class ScreenTimeControlModule extends NativeModule<ScreenTimeControlModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ScreenTimeControlModule>('ScreenTimeControl');
