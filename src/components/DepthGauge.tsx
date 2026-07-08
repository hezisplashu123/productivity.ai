import React from 'react';
import { View } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

interface DepthGaugeProps {
  tier: number;
  maxTier: number;
  color: string;
}

export const DepthGauge = ({ tier, maxTier, color }: DepthGaugeProps) => {
  const height = 36;
  const dotRadius = 3;
  const lineX = 7;
  
  const topY = 6;
  const bottomY = height - 6;
  
  const range = bottomY - topY;
  const step = maxTier > 1 ? range / (maxTier - 1) : 0;
  const dotY = topY + (tier - 1) * step;

  return (
    <View style={{ width: 14, height: 36, marginTop: 2 }}>
      <Svg width="100%" height="100%">
        {/* Main vertical line */}
        <Line x1={lineX} y1={topY} x2={lineX} y2={bottomY} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" />
        
        {/* Top tick mark (the surface) */}
        <Line x1={lineX - 4} y1={topY} x2={lineX + 4} y2={topY} stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinecap="round" />
        
        {/* The active dot */}
        <Circle cx={lineX} cy={dotY} r={dotRadius} fill={color} />
      </Svg>
    </View>
  );
};
