import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from "../components/ProgressBar";
import * as StoreReview from 'expo-store-review';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 340;
const CARD_SPACING = 16;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Rating'>;

export default function RatingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const badgeScale = useRef(new Animated.Value(0.9)).current;

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Animated values for each testimonial card
  const testimonialAnims = useRef(
    Array.from({ length: 8 }).map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger testimonial animations
    testimonialAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: 200 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          delay: 200 + index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Auto-scroll carousel every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % testimonials.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_SPACING),
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show native system rating popup
    try {
      const isAvailable = await StoreReview.hasAction();
      if (isAvailable) {
        await StoreReview.requestReview();
        console.log('[Rating] Native rating popup shown');
      } else {
        console.log('[Rating] Native rating popup not available');
      }
    } catch (error) {
      console.warn('[Rating] Error showing native rating popup:', error);
    }

    // Navigate to feedback screen after showing rating popup
    navigation.navigate('Feedback');
  };

  const testimonials = [
    {
      name: 'Sarah C.',
      role: 'Medical Student',
      text: 'My grades improved dramatically — I finally understand my lectures without rereading.',
      rating: 5,
    },
    {
      name: 'David Kim',
      role: 'Software Engineer',
      text: 'Game changer for my productivity. The AI summaries are incredibly accurate and save me so much time.',
      rating: 5,
    },
    {
      name: 'Emma Rodriguez',
      role: 'Graduate Student',
      text: 'The AI quizzes helped me ace my finals. I retained 90% more information than traditional studying.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Law Student',
      text: 'Transformed how I study case law. The intelligent organization makes everything so much clearer.',
      rating: 5,
    },
    {
      name: 'Jessica Thompson',
      role: 'Business Analyst',
      text: 'I process hours of meeting recordings in minutes. This tool is absolutely essential for my work.',
      rating: 5,
    },
    {
      name: 'Alex Martinez',
      role: 'PhD Candidate',
      text: 'Best investment in my education. The personalized AI adapts perfectly to my research needs.',
      rating: 5,
    },
    {
      name: 'Olivia White',
      role: 'High School Senior',
      text: 'Helped me get into my dream college! My SAT scores improved dramatically with AI-powered study.',
      rating: 5,
    },
    {
      name: 'James Park',
      role: 'Entrepreneur',
      text: 'I learn from podcasts and videos efficiently now. NoteBoost AI turned every moment into learning.',
      rating: 5,
    },
  ];

  return (
    <View className="flex-1">
      {/* Multi-layer gradient background */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Subtle texture overlay with animated dots */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.04,
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: "#60A5FA",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </View>

      {/* Header with progress bar and back button */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          marginBottom: 12,
        }}
      >
        {/* Back button and Progress Bar in horizontal layout */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Back button */}
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 2,
            })}
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </Pressable>

          {/* Progress Bar takes remaining space */}
          <View style={{ flex: 1 }}>
            <ProgressBar currentScreen="Rating" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 24,
          }}
        >
          {/* Header */}
          <View style={{ marginTop: 32, marginBottom: 36 }}>
            <Text style={{ fontSize: 34, fontWeight: "800", color: "#1e293b", lineHeight: 42, letterSpacing: -1 }}>
              Join 50,000+ learners who mastered their notes with NoteBoost AI
            </Text>
          </View>

          {/* Center Badge with Glassmorphic Design */}
          <Animated.View
            style={{
              marginBottom: 48,
              transform: [{ scale: badgeScale }],
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 32,
                padding: 36,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              {/* Decorative leaves positioned outside */}
              <View style={{ position: "absolute", left: -20, top: 32 }}>
                <Text style={{ fontSize: 56 }}>🌿</Text>
              </View>
              <View style={{ position: "absolute", right: -20, top: 32, transform: [{ scaleX: -1 }] }}>
                <Text style={{ fontSize: 56 }}>🌿</Text>
              </View>

              {/* Student/Learning Icons instead of colored circles */}
              <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24 }}>
                {/* Graduation Cap */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(96, 165, 250, 0.15)",
                    borderWidth: 3,
                    borderColor: "rgba(255, 255, 255, 0.9)",
                    shadowColor: "#60A5FA",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="school" size={28} color="#60A5FA" />
                </View>

                {/* Brain/Learning */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(139, 92, 246, 0.15)",
                    borderWidth: 3,
                    borderColor: "rgba(255, 255, 255, 0.9)",
                    marginLeft: -18,
                    shadowColor: "#8B5CF6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="bulb" size={28} color="#8B5CF6" />
                </View>

                {/* Trophy/Success */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    borderWidth: 3,
                    borderColor: "rgba(255, 255, 255, 0.9)",
                    marginLeft: -18,
                    shadowColor: "#F59E0B",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="trophy" size={28} color="#F59E0B" />
                </View>
              </View>

              {/* Stats with gradient text effect */}
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: "#60A5FA",
                    fontSize: 56,
                    fontWeight: "900",
                    marginBottom: 8,
                    letterSpacing: -2,
                  }}
                >
                  50,000+
                </Text>
                <Text
                  style={{
                    color: "#64748b",
                    fontSize: 18,
                    textAlign: "center",
                    lineHeight: 26,
                    fontWeight: "600",
                  }}
                >
                  successful students{'\n'}and counting
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Testimonials Section Header */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
                color: "#1e293b",
                marginBottom: 8,
                letterSpacing: -0.5,
              }}
            >
              What Our Students Say
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#64748b",
                fontWeight: "500",
              }}
            >
              Real results from real students
            </Text>
          </View>
        </Animated.View>

        {/* Testimonials - Horizontal Scroll with Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
          style={{ marginBottom: 16 }}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="start"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: (event: any) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
                setCurrentIndex(index);
              }
            }
          )}
          scrollEventThrottle={16}
        >
          {testimonials.map((testimonial, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: testimonialAnims[index].opacity,
                transform: [{ translateY: testimonialAnims[index].translateY }],
                marginRight: CARD_SPACING,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderRadius: 24,
                  padding: 24,
                  width: CARD_WIDTH,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 5,
                }}
              >
                {/* Header with name, role, and stars */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#1e293b", fontSize: 20, fontWeight: "800", marginBottom: 4, letterSpacing: -0.3 }}>
                        {testimonial.name}
                      </Text>
                      <Text style={{ color: "#60A5FA", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {testimonial.role}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome key={star} name="star" size={14} color="#F59E0B" style={{ marginHorizontal: 1 }} />
                      ))}
                    </View>
                  </View>
                </View>

                {/* Testimonial Text */}
                <Text
                  style={{
                    color: "#475569",
                    fontSize: 16,
                    lineHeight: 24,
                    marginBottom: 20,
                    fontWeight: "500",
                  }}
                >
                  "{testimonial.text}"
                </Text>

                {/* Before/After Comparison - Glassmorphic */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View
                    style={{
                      flex: 1,
                      height: 120,
                      backgroundColor: "rgba(148, 163, 184, 0.1)",
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
                    <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 8, fontWeight: "600" }}>Before</Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      height: 120,
                      backgroundColor: "rgba(96, 165, 250, 0.15)",
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "rgba(96, 165, 250, 0.4)",
                      shadowColor: "#60A5FA",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                    }}
                  >
                    <Ionicons name="sparkles" size={36} color="#60A5FA" />
                    <Text style={{ color: "#60A5FA", fontSize: 13, marginTop: 8, fontWeight: "700" }}>After AI</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Carousel Indicator Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24, paddingHorizontal: 24 }}>
          {testimonials.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                scrollViewRef.current?.scrollTo({
                  x: index * (CARD_WIDTH + CARD_SPACING),
                  animated: true,
                });
                setCurrentIndex(index);
              }}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? "#60A5FA" : "rgba(148, 163, 184, 0.3)",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Next Button - Fixed at bottom with glassmorphic gradient */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
      >
        {/* Light gradient fade */}
        <LinearGradient
          colors={["rgba(255, 249, 230, 0)", "rgba(255, 249, 230, 0.95)", "#FFF9E6"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
          }}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: "hidden",
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 6,
            })}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 }}>
                Next
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
