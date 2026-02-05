import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ZoomableImageViewerProps {
  uri: string;
}

export const ZoomableImageViewer: React.FC<ZoomableImageViewerProps> = ({ uri }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 5) {
        scale.value = withSpring(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Reanimated.View
        style={[
          {
            width: '100%',
            height: '80%',
            justifyContent: 'center',
            alignItems: 'center',
          },
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: SCREEN_WIDTH, height: '100%' }}
          contentFit="contain"
        />
      </Reanimated.View>
    </GestureDetector>
  );
};

export default ZoomableImageViewer;

