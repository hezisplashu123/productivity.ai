import * as React from 'react';

import { ScreenTimeControlViewProps } from './ScreenTimeControl.types';

export default function ScreenTimeControlView(props: ScreenTimeControlViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
