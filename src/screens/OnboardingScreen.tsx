import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useOnboardingStore, OnboardingAnswers } from "../state/onboardingStore";
import { useProgressStore } from "../state/progressStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import Slider from "@react-native-community/slider";
import { ProgressBar } from "../components/ProgressBar";

const { width } = Dimensions.get("window");

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding">;
};

interface Question {
  id: keyof OnboardingAnswers;
  type: "single" | "multiple" | "text" | "slider";
  question: string;
  subtext?: string;
  options?: { value: string; label: string; icon?: string }[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    unit: string;
  };
}

const questions: Question[] = [
  {
    id: "mainStruggle",
    type: "single",
    question: "What kind of things do you take notes on most often?",
    subtext: "Help us understand how you'll use NoteBoost AI",
    options: [
      { value: "work", label: "Work meetings & projects", icon: "💼" },
      { value: "classes", label: "Classes & lectures", icon: "🎓" },
      { value: "books", label: "Books & articles", icon: "📚" },
      { value: "videos", label: "Videos & podcasts", icon: "🎬" },
      { value: "ideas", label: "Personal ideas & thoughts", icon: "💡" },
    ],
  },
  {
    id: "dreamOutcome",
    type: "single",
    question: "Which statement describes you best?",
    subtext: "Choose the one that resonates most with you",
    options: [
      { value: "detailed-forgetful", label: "I take detailed notes, but forget them later", icon: "📝" },
      { value: "getting-started", label: "I'm just starting to organize my learning", icon: "🌱" },
      { value: "effortless", label: "I want AI to make note-taking effortless", icon: "🤖" },
      { value: "mastery", label: "I want to master and retain everything", icon: "🎯" },
    ],
  },
  {
    id: "learningGoal",
    type: "slider",
    question: "How much time do you waste re-reading notes each week?",
    subtext: "Be honest - this helps us calculate your time savings",
    sliderConfig: {
      min: 0,
      max: 15,
      step: 0.5,
      unit: "hours",
    },
  },
  {
    id: "commitment",
    type: "single",
    question: "How would you like NoteBoost AI to help you?",
    subtext: "We'll personalize your experience based on this",
    options: [
      { value: "summarize", label: "Summarize everything automatically", icon: "📋" },
      { value: "quiz", label: "Quiz me to test my understanding", icon: "🧠" },
      { value: "organize", label: "Organize topics intelligently", icon: "🗂️" },
      { value: "all", label: "All of the above - maximize results", icon: "🚀" },
    ],
  },
  {
    id: "obstacles",
    type: "single",
    question: "How serious are you about transforming your learning?",
    subtext: "This helps us match the right experience for you",
    options: [
      { value: "all-in", label: "All in - show me everything", icon: "🔥" },
      { value: "serious", label: "Very serious - I need real results", icon: "💪" },
      { value: "curious", label: "Curious - I'll start small", icon: "🤔" },
      { value: "exploring", label: "Just exploring for now", icon: "👀" },
    ],
  },
];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboardingStore();
  const { setProgress } = useProgressStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [multipleSelection, setMultipleSelection] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(5); // Default to 5 hours

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const isTransitioning = useRef(false); // Prevent rapid button presses

  // Option animations for staggered reveal
  const optionAnims = useRef(
    Array.from({ length: 6 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  // Celebration animation refs
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Update progress bar based on current question step
  React.useEffect(() => {
    const totalQuestions = questions.length; // 5 questions
    const progressPercentage = (currentStep / totalQuestions) * 100;
    setProgress("Onboarding", progressPercentage);
  }, [currentStep, setProgress]);

  React.useEffect(() => {
    console.log('[Onboarding] Component mounted, currentStep:', currentStep);

    // Main fade and slide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger option animations
    const currentQuestion = questions[currentStep];
    if (currentQuestion?.options) {
      // Reset all options
      optionAnims.forEach(anim => {
        anim.opacity.setValue(0);
        anim.translateY.setValue(20);
      });

      // Animate each option with stagger
      currentQuestion.options.forEach((_, index) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(optionAnims[index].opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(optionAnims[index].translateY, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 100); // 100ms stagger between each option
      });
    }

    // Progress celebration at 50% and 75%
    const progressPercentage = ((currentStep + 1) / questions.length) * 100;
    if (progressPercentage === 60 || progressPercentage === 80) { // Questions 3 and 4
      // Quick celebration animation
      celebrationScale.setValue(0);
      celebrationOpacity.setValue(1);

      Animated.sequence([
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 300,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep]);

  const handleAnswer = useCallback((questionId: keyof OnboardingAnswers, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleMultipleAnswer = useCallback((value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMultipleSelection((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Save the onboarding data
    completeOnboarding(answers as OnboardingAnswers, "");
    // Navigate directly to AI generation screen
    navigation.reset({
      index: 0,
      routes: [{ name: "AIGeneration" }],
    });
  }, [answers, completeOnboarding, navigation]);

  const handleNext = useCallback(() => {
    // Prevent rapid button presses causing race conditions
    if (isTransitioning.current) {
      console.log('[Onboarding] Ignoring rapid press, already transitioning');
      return;
    }

    const currentQuestion = questions[currentStep];
    if (!currentQuestion) {
      console.log('[Onboarding] No current question, aborting');
      return;
    }

    isTransitioning.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentQuestion.type === "multiple") {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: multipleSelection }));
      setMultipleSelection([]);
    } else if (currentQuestion.type === "slider") {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: sliderValue.toString() }));
    }

    if (currentStep < questions.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep((prev) => prev + 1);
        fadeAnim.setValue(0);
        slideAnim.setValue(50);

        // Reset slider value for next slider question if any
        if (questions[currentStep + 1]?.type === "slider") {
          setSliderValue(5);
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Re-enable button after animation completes
          isTransitioning.current = false;
        });
      });
    } else {
      // Complete onboarding
      handleComplete();
    }
  }, [currentStep, multipleSelection, sliderValue, answers, fadeAnim, slideAnim, handleComplete]);

  const handlePersonalizationComplete = useCallback(() => {
    // This is no longer used but kept for backwards compatibility
  }, []);

  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentQuestion = questions[currentStep];

  // Safety check: if currentQuestion is undefined, return early
  if (!currentQuestion) {
    return null;
  }

  const isAnswered = currentQuestion.type === "multiple"
    ? multipleSelection.length > 0
    : currentQuestion.type === "slider"
    ? true // Slider is always "answered" since it has a default value
    : !!answers[currentQuestion.id as keyof OnboardingAnswers];

  // AI Mirroring - personalized feedback based on answers
  const getAIFeedback = () => {
    if (currentQuestion.type === "slider") {
      // For slider, show feedback dynamically based on value
      if (sliderValue === 0) return "Great - you're already efficient! We'll help you stay that way";
      if (sliderValue <= 2) return `${sliderValue} hours - let's optimize that further`;
      if (sliderValue <= 5) return `${sliderValue} hours/week - we can help you save most of that`;
      if (sliderValue <= 8) return `${sliderValue} hours/week - that's ${sliderValue * 52} hours per year wasted!`;
      return `${sliderValue} hours/week - imagine getting all that time back`;
    }

    const answer = answers[currentQuestion.id as keyof OnboardingAnswers] as string;
    if (!answer || !isAnswered) return null;

    const feedbackMap: Record<string, Record<string, string>> = {
      mainStruggle: {
        work: "Perfect - we'll optimize for meetings & project notes",
        classes: "Got it - we'll help you ace your studies",
        books: "Great choice - we'll help you retain everything you read",
        videos: "Excellent - we'll make every video count",
        ideas: "Love it - we'll help you capture & organize your thoughts",
      },
      dreamOutcome: {
        "detailed-forgetful": "We'll make sure your notes stick this time",
        "getting-started": "Let's build your foundation together",
        "effortless": "AI-powered automation coming your way",
        "mastery": "We'll help you become a retention master",
      },
      commitment: {
        summarize: "Smart summaries will save you hours",
        quiz: "Active recall - proven to boost retention",
        organize: "Intelligent organization on autopilot",
        all: "Maximum results mode activated 🚀",
      },
      obstacles: {
        "all-in": "Love the energy - let's unlock everything",
        serious: "We'll deliver real, measurable results",
        curious: "Perfect - you can explore at your pace",
        exploring: "Take your time - we're here when ready",
      },
    };

    return feedbackMap[currentQuestion.id]?.[answer];
  };

  // Dynamic button text with foot-in-the-door phrasing
  const getButtonText = () => {
    if (currentStep === questions.length - 1) {
      return "Build My AI Plan →";
    }
    if (currentStep >= 2) {
      return "Continue Building →";
    }
    return "Continue →";
  };

  // Progress encouragement
  const getProgressMessage = () => {
    if (currentStep === 0) return null;
    if (currentStep === 2) return "You're halfway there 🚀";
    if (currentStep === questions.length - 2) return "One more question to complete your profile 👇";
    return null;
  };

  const aiFeedback = getAIFeedback();
  const progressMessage = getProgressMessage();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Unified light gradient background */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      <View style={{ flex: 1 }}>
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
            {/* Back button - Always visible with glassmorphic rounded square design */}
            <Pressable
              onPress={() => {
                if (currentStep > 0) {
                  setCurrentStep((prev) => prev - 1);
                } else {
                  // First screen, navigate back in navigation stack
                  navigation.goBack();
                }
              }}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
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
              <ProgressBar currentScreen="Onboarding" />
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Question */}
            <View className="mb-8">
              <Text style={{ color: "#1e293b", fontSize: 32, fontWeight: "700", lineHeight: 40, marginBottom: 12 }}>
                {currentQuestion.question}
              </Text>
              {/* Dynamic subtext - shows AI feedback when answer selected, otherwise shows default subtext */}
              <Text style={{ color: "#64748b", fontSize: 16, lineHeight: 24, marginBottom: 8 }}>
                {aiFeedback || currentQuestion.subtext}
              </Text>

              {/* Progress encouragement message */}
              {progressMessage && (
                <View style={{
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: "rgba(96, 165, 250, 0.2)",
                }}>
                  <Text style={{ color: "#60A5FA", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
                    {progressMessage}
                  </Text>
                </View>
              )}
            </View>

            {/* Options or Slider */}
            {currentQuestion.type === "slider" ? (
              // Slider UI
              <View style={{ paddingBottom: 100 }}>
                <View style={{
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderRadius: 24,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 6,
                }}>
                  {/* Large Time Display */}
                  <View style={{ alignItems: "center", marginBottom: 32 }}>
                    <Text style={{ color: "#60A5FA", fontSize: 64, fontWeight: "bold", lineHeight: 72 }}>
                      {sliderValue}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 20, fontWeight: "600", marginTop: 4 }}>
                      {currentQuestion.sliderConfig?.unit}
                    </Text>
                  </View>

                  {/* Slider */}
                  <Slider
                    style={{ width: "100%", height: 50 }}
                    minimumValue={currentQuestion.sliderConfig?.min || 0}
                    maximumValue={currentQuestion.sliderConfig?.max || 10}
                    step={currentQuestion.sliderConfig?.step || 1}
                    value={sliderValue}
                    onValueChange={(value) => {
                      setSliderValue(value);
                      // Haptic feedback on value change
                      if (Math.floor(value) !== Math.floor(sliderValue)) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    minimumTrackTintColor="#60A5FA"
                    maximumTrackTintColor="#E2E8F0"
                    thumbTintColor="#3B82F6"
                  />

                  {/* Min/Max Labels */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500" }}>
                      {currentQuestion.sliderConfig?.min} {currentQuestion.sliderConfig?.unit}
                    </Text>
                    <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "500" }}>
                      {currentQuestion.sliderConfig?.max}+ {currentQuestion.sliderConfig?.unit}
                    </Text>
                  </View>

                  {/* Time Savings Calculation */}
                  {sliderValue > 0 && (
                    <View style={{
                      marginTop: 24,
                      padding: 16,
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "rgba(96, 165, 250, 0.2)",
                    }}>
                      <Text style={{ color: "#1e293b", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
                        That's {Math.round(sliderValue * 52)} hours per year! 🤯
                      </Text>
                      <Text style={{ color: "#64748b", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                        NoteBoost AI can help you save {Math.round(sliderValue * 0.7 * 52)} of those hours
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              // Options UI (existing code)
              <View className="space-y-4 pb-32">
                {currentQuestion.options?.map((option, index) => {
                  const isSelected = currentQuestion.type === "multiple"
                    ? multipleSelection.includes(option.value)
                    : answers[currentQuestion.id as keyof OnboardingAnswers] === option.value;

                  return (
                    <Animated.View
                      key={option.value}
                      style={{
                        opacity: optionAnims[index]?.opacity || 1,
                        transform: [{ translateY: optionAnims[index]?.translateY || 0 }],
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          if (currentQuestion.type === "multiple") {
                            handleMultipleAnswer(option.value);
                          } else {
                            handleAnswer(currentQuestion.id as keyof OnboardingAnswers, option.value);
                          }
                        }}
                        style={{
                          width: "100%",
                          borderRadius: 20,
                          padding: 20,
                          marginBottom: 12,
                          backgroundColor: isSelected ? "rgba(96, 165, 250, 0.9)" : "rgba(255, 255, 255, 0.7)",
                          borderWidth: 1,
                          borderColor: isSelected ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.8)",
                          shadowColor: isSelected ? "#3B82F6" : "#7DD3FC",
                          shadowOffset: { width: 0, height: isSelected ? 6 : 8 },
                          shadowOpacity: isSelected ? 0.35 : 0.25,
                          shadowRadius: isSelected ? 14 : 16,
                          elevation: isSelected ? 8 : 5,
                        }}
                      >
                        <View className="flex-row items-center">
                          {option.icon && (
                            <Text className="text-3xl mr-4">{option.icon}</Text>
                          )}
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "600",
                              flex: 1,
                              color: isSelected ? "#FFFFFF" : "#1e293b"
                            }}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={28} color="#fff" />
                          )}
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Next Button */}
        <View
          className="px-6"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <Pressable
            onPress={handleNext}
            disabled={!isAnswered}
            style={({ pressed }) => ({
              width: "100%",
              overflow: "hidden",
              borderRadius: 16,
              transform: [{ scale: pressed && isAnswered ? 0.97 : 1 }],
              shadowColor: isAnswered ? "#3B82F6" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: isAnswered ? 4 : 0,
              opacity: isAnswered ? 1 : 0.5,
            })}
          >
            <LinearGradient
              colors={isAnswered ? ["#60A5FA", "#3B82F6"] : ["rgba(148, 163, 184, 0.3)", "rgba(148, 163, 184, 0.3)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: "100%",
                paddingVertical: 18,
                alignItems: "center",
                borderRadius: 16,
              }}
            >
              <Text style={{
                color: isAnswered ? "#FFFFFF" : "#94A3B8",
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: -0.3,
              }}>
                {getButtonText()}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
