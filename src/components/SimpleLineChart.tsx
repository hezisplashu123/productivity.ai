import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ChartDataPoint {
  date: string;
  value: number;
}

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  height = 180,
  color = '#3B82F6',
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const chartWidth = width - 48 - 40; // Subtract padding and y-axis width
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  const pointSpacing = data.length > 1 ? chartWidth / (data.length - 1) : 0;
  
  // Create path for line
  const createPath = () => {
    if (data.length === 0) return '';
    
    let path = `M 0 ${height - ((data[0].value - minValue) / range) * height}`;
    
    for (let i = 1; i < data.length; i++) {
      const x = i * pointSpacing;
      const y = height - ((data[i].value - minValue) / range) * height;
      path += ` L ${x} ${y}`;
    }
    
    return path;
  };
  
  // Create path for area fill
  const createAreaPath = () => {
    const linePath = createPath();
    if (!linePath) return '';
    
    const lastX = (data.length - 1) * pointSpacing;
    return `${linePath} L ${lastX} ${height} L 0 ${height} Z`;
  };

  const path = createPath();
  const areaPath = createAreaPath();

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Area fill */}
        <Path d={areaPath} fill="url(#chartGradient)" />
        
        {/* Line */}
        <Path
          d={path}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = index * pointSpacing;
          const y = height - ((point.value - minValue) / range) * height;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r={index === data.length - 1 ? 5 : 4}
              fill={index === data.length - 1 ? color : '#FFFFFF'}
              stroke={color}
              strokeWidth={index === data.length - 1 ? 2 : 0}
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

