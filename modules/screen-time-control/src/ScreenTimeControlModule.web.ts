import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ScreenTimeControl.types';

type ScreenTimeControlModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ScreenTimeControlModule extends NativeModule<ScreenTimeControlModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ScreenTimeControlModule, 'ScreenTimeControlModule');
