import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [NetInfo, setNetInfo] = useState<any>(null);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  // Lazy load NetInfo to avoid NativeEventEmitter error
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadNetInfo = async () => {
      try {
        const netInfoModule = await import('@react-native-community/netinfo');
        setNetInfo(netInfoModule.default);

        unsubscribe = netInfoModule.default.addEventListener(state => {
          const offline = !state.isConnected;
          setIsOffline(offline);

          if (offline) {
            // Slide down
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          } else {
            // Slide up after a delay
            setTimeout(() => {
              Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }, 2000);
          }
        });
      } catch (error) {
        console.error('[OfflineIndicator] Failed to load NetInfo:', error);
      }
    };

    loadNetInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Show indicator when offline or during animation
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShouldRender(true);
    }
  }, [isOffline]);

  if (!shouldRender && !isOffline) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        className="px-4 py-3 flex-row items-center justify-center"
        style={{
          backgroundColor: isOffline ? '#ef4444' : '#10b981',
        }}
      >
        <Ionicons
          name={isOffline ? 'cloud-offline' : 'cloud-done'}
          size={20}
          color="white"
        />
        <Text className="text-white font-semibold ml-2">
          {isOffline
            ? 'No internet connection'
            : 'Back online'}
        </Text>
      </View>
    </Animated.View>
  );
}
