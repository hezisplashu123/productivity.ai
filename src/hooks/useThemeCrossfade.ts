import { useEffect } from 'react';
import { useSharedValue, withTiming, interpolateColor, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

export function useThemeCrossfade(currentColor: string, duration: number = 300) {
  const prevColor = useSharedValue(currentColor);
  const nextColor = useSharedValue(currentColor);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (nextColor.value !== currentColor) {
      prevColor.value = interpolateColor(
        progress.value,
        [0, 1],
        [prevColor.value, nextColor.value]
      ) as string;
      
      nextColor.value = currentColor;
      progress.value = 0;
      progress.value = withTiming(1, { duration });
    }
  }, [currentColor]);

  const backgroundColorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [prevColor.value, nextColor.value])
  }));

  const borderColorStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [prevColor.value, nextColor.value])
  }));

  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [prevColor.value, nextColor.value])
  }));

  const animatedColor = useDerivedValue(() => {
    return interpolateColor(progress.value, [0, 1], [prevColor.value, nextColor.value]);
  });

  return { progress, prevColor, nextColor, backgroundColorStyle, borderColorStyle, colorStyle, animatedColor };
}
