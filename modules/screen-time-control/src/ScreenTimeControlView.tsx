import { requireNativeView } from 'expo';
import * as React from 'react';

import { ScreenTimeControlViewProps } from './ScreenTimeControl.types';

const NativeView: React.ComponentType<ScreenTimeControlViewProps> =
  requireNativeView('ScreenTimeControl');

export default function ScreenTimeControlView(props: ScreenTimeControlViewProps) {
  return <NativeView {...props} />;
}
