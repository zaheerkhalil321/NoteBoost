import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '../services/database';
import {
  generateReferralCode,
  createOrGetUser,
  redeemReferralCode,
  getReferralStats,
  getReferredUsers,
  useCredits as spendCredits,
  getUserCredits,
} from '../services/referralService';

type Props = NativeStackScreenProps<RootStackParamList, 'BackendTest'>;

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: string;
}

export default function BackendTestScreen({ navigation }: Props) {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Database Connection', status: 'pending' },
    { name: 'Generate Referral Code', status: 'pending' },
    { name: 'Create User with Referral Code', status: 'pending' },
    { name: 'Referral Code Uniqueness', status: 'pending' },
    { name: 'Redeem Referral Code', status: 'pending' },
    { name: 'Prevent Self-Referral', status: 'pending' },
    { name: 'Prevent Double Redemption', status: 'pending' },
    { name: 'Track Referral Progress (1/3)', status: 'pending' },
    { name: 'Track Referral Progress (2/3)', status: 'pending' },
    { name: 'Award Credits at 3 Referrals', status: 'pending' },
    { name: 'Reset Progress After Reward', status: 'pending' },
    { name: 'Use Credits', status: 'pending' },
    { name: 'Get Referred Users', status: 'pending' },
    { name: 'Test 5 Cycle Cap (15 referrals max)', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let testUserId: string | null = null;
    let testReferralCode: string | null = null;
    let referrer1Code: string | null = null;
    let referrer2Code: string | null = null;
    let referrer3Code: string | null = null;

    try {
      // Test 1: Database Connection
      updateTest(0, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const db = getDatabase();
        const result = await db.getFirstAsync<any>('SELECT 1 as test');
        if (result?.test === 1) {
          updateTest(0, {
            status: 'passed',
            message: 'Database is connected and responsive',
            details: 'SQLite initialized successfully'
          });
        } else {
          throw new Error('Unexpected result');
        }
      } catch (error: any) {
        updateTest(0, {
          status: 'failed',
          message: 'Database connection failed',
          details: error.message
        });
        setIsRunning(false);
        return;
      }

      // Test 2: Generate Referral Code
      updateTest(1, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const code = generateReferralCode();
        if (/^[0-9]{3}[A-Z]{3}$/.test(code)) {
          updateTest(1, {
            status: 'passed',
            message: 'Generated valid referral code',
            details: `Code format: ${code} (3 numbers + 3 letters)`
          });
          testReferralCode = code;
        } else {
          throw new Error(`Invalid format: ${code}`);
        }
      } catch (error: any) {
        updateTest(1, {
          status: 'failed',
          message: 'Failed to generate valid code',
          details: error.message
        });
        setIsRunning(false);
        return;
      }

      // Test 3: Create User with Referral Code
      updateTest(2, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const user = await createOrGetUser();
        if (user.id && user.referralCode && user.credits === 0) {
          updateTest(2, {
            status: 'passed',
            message: 'User created successfully',
            details: `User ID: ${user.id.substring(0, 20)}...\nCode: ${user.referralCode}`
          });
          testUserId = user.id;
          testReferralCode = user.referralCode;
        } else {
          throw new Error('Invalid user data');
        }
      } catch (error: any) {
        updateTest(2, {
          status: 'failed',
          message: 'Failed to create user',
          details: error.message
        });
        setIsRunning(false);
        return;
      }

      // Test 4: Referral Code Uniqueness
      updateTest(3, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const db = getDatabase();
        const codes = await db.getAllAsync<any>(
          'SELECT referral_code FROM users LIMIT 100'
        );
        const uniqueCodes = new Set(codes.map(c => c.referral_code));
        if (codes.length === uniqueCodes.size) {
          updateTest(3, {
            status: 'passed',
            message: 'All referral codes are unique',
            details: `Checked ${codes.length} codes, all unique`
          });
        } else {
          throw new Error('Duplicate codes found');
        }
      } catch (error: any) {
        updateTest(3, {
          status: 'failed',
          message: 'Code uniqueness check failed',
          details: error.message
        });
      }

      // Create test referrers for remaining tests
      const db = getDatabase();

      // Create referrer 1
      const ref1Id = `test_referrer1_${Date.now()}_${Math.random()}`;
      referrer1Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [ref1Id, referrer1Code, 0, Date.now()]
      );

      // Create referrer 2
      const ref2Id = `test_referrer2_${Date.now()}_${Math.random()}`;
      referrer2Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [ref2Id, referrer2Code, 0, Date.now()]
      );

      // Create referrer 3
      const ref3Id = `test_referrer3_${Date.now()}_${Math.random()}`;
      referrer3Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [ref3Id, referrer3Code, 0, Date.now()]
      );

      // Create test referee 1
      const referee1Id = `test_referee1_${Date.now()}_${Math.random()}`;
      const referee1Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [referee1Id, referee1Code, 0, Date.now()]
      );

      // Test 5: Redeem Referral Code
      updateTest(4, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const result = await redeemReferralCode(referee1Id, referrer1Code!);
        if (result.success) {
          updateTest(4, {
            status: 'passed',
            message: 'Referral code redeemed successfully',
            details: `Referee ${referee1Id.substring(0, 20)}... used code ${referrer1Code}`
          });
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (error: any) {
        updateTest(4, {
          status: 'failed',
          message: 'Failed to redeem code',
          details: error.message
        });
      }

      // Test 6: Prevent Self-Referral
      updateTest(5, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const referee2Id = `test_referee2_${Date.now()}_${Math.random()}`;
        const referee2Code = generateReferralCode();
        await db.runAsync(
          'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
          [referee2Id, referee2Code, 0, Date.now()]
        );

        const result = await redeemReferralCode(referee2Id, referee2Code);
        if (!result.success && result.error?.includes('own referral code')) {
          updateTest(5, {
            status: 'passed',
            message: 'Self-referral correctly prevented',
            details: result.error
          });
        } else {
          throw new Error('Self-referral was not prevented');
        }
      } catch (error: any) {
        updateTest(5, {
          status: 'failed',
          message: 'Self-referral prevention failed',
          details: error.message
        });
      }

      // Test 7: Prevent Double Redemption
      updateTest(6, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const result = await redeemReferralCode(referee1Id, referrer2Code!);
        if (!result.success && result.error?.includes('already used')) {
          updateTest(6, {
            status: 'passed',
            message: 'Double redemption correctly prevented',
            details: result.error
          });
        } else {
          throw new Error('Double redemption was not prevented');
        }
      } catch (error: any) {
        updateTest(6, {
          status: 'failed',
          message: 'Double redemption prevention failed',
          details: error.message
        });
      }

      // Test 8: Track Referral Progress (1/3)
      updateTest(7, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const stats = await getReferralStats(ref1Id);
        if (stats.currentProgress === 1 && stats.totalCredits === 0) {
          updateTest(7, {
            status: 'passed',
            message: 'Progress tracked: 1/3 referrals',
            details: `Progress: ${stats.currentProgress}, Credits: ${stats.totalCredits}`
          });
        } else {
          throw new Error(`Expected 1/3, got ${stats.currentProgress}/3`);
        }
      } catch (error: any) {
        updateTest(7, {
          status: 'failed',
          message: 'Progress tracking failed',
          details: error.message
        });
      }

      // Create referee 3 and 4 for testing progress
      const referee3Id = `test_referee3_${Date.now()}_${Math.random()}`;
      const referee3Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [referee3Id, referee3Code, 0, Date.now()]
      );
      await redeemReferralCode(referee3Id, referrer1Code!);

      // Test 9: Track Referral Progress (2/3)
      updateTest(8, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const stats = await getReferralStats(ref1Id);
        if (stats.currentProgress === 2 && stats.totalCredits === 0) {
          updateTest(8, {
            status: 'passed',
            message: 'Progress tracked: 2/3 referrals',
            details: `Progress: ${stats.currentProgress}, Credits: ${stats.totalCredits}`
          });
        } else {
          throw new Error(`Expected 2/3, got ${stats.currentProgress}/3`);
        }
      } catch (error: any) {
        updateTest(8, {
          status: 'failed',
          message: 'Progress tracking failed',
          details: error.message
        });
      }

      // Create referee 5 for completing 3 referrals
      const referee4Id = `test_referee4_${Date.now()}_${Math.random()}`;
      const referee4Code = generateReferralCode();
      await db.runAsync(
        'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
        [referee4Id, referee4Code, 0, Date.now()]
      );
      await redeemReferralCode(referee4Id, referrer1Code!);

      // Test 10: Award Credits at 3 Referrals
      updateTest(9, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const stats = await getReferralStats(ref1Id);
        if (stats.totalCredits === 5) {
          updateTest(9, {
            status: 'passed',
            message: '5 credits awarded after 3 referrals',
            details: `Credits: ${stats.totalCredits}, Total referrals: ${stats.totalReferrals}`
          });
        } else {
          throw new Error(`Expected 5 credits, got ${stats.totalCredits}`);
        }
      } catch (error: any) {
        updateTest(9, {
          status: 'failed',
          message: 'Credit award failed',
          details: error.message
        });
      }

      // Test 11: Reset Progress After Reward
      updateTest(10, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const stats = await getReferralStats(ref1Id);
        if (stats.currentProgress === 0 && stats.totalReferrals === 3) {
          updateTest(10, {
            status: 'passed',
            message: 'Progress reset after reward',
            details: `Current progress: ${stats.currentProgress}, Total referrals: ${stats.totalReferrals}`
          });
        } else {
          throw new Error(`Expected progress 0, got ${stats.currentProgress}`);
        }
      } catch (error: any) {
        updateTest(10, {
          status: 'failed',
          message: 'Progress reset failed',
          details: error.message
        });
      }

      // Test 12: Use Credits
      updateTest(11, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const result = await spendCredits(ref1Id, 2);
        if (result.success && result.remainingCredits === 3) {
          updateTest(11, {
            status: 'passed',
            message: 'Credits used successfully',
            details: `Used 2 credits, remaining: ${result.remainingCredits}`
          });
        } else {
          throw new Error(`Expected 3 remaining, got ${result.remainingCredits}`);
        }
      } catch (error: any) {
        updateTest(11, {
          status: 'failed',
          message: 'Credit usage failed',
          details: error.message
        });
      }

      // Test 13: Get Referred Users
      updateTest(12, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const users = await getReferredUsers(ref1Id);
        // Should be 0 because all were rewarded and moved to 'rewarded' status
        if (users.length === 0) {
          updateTest(12, {
            status: 'passed',
            message: 'Referred users retrieved correctly',
            details: `Found ${users.length} current referrals (rewarded ones archived)`
          });
        } else {
          throw new Error(`Expected 0 current referrals, got ${users.length}`);
        }
      } catch (error: any) {
        updateTest(12, {
          status: 'failed',
          message: 'Get referred users failed',
          details: error.message
        });
      }

      // Test 14: 5 Cycle Cap (15 referrals max = 25 credits)
      updateTest(13, { status: 'running' });
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        // Create a test user who will be the referrer
        const capTestReferrerId = `cap_test_${Date.now()}_${Math.random()}`;
        const capTestReferrerCode = generateReferralCode();
        await db.runAsync(
          'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
          [capTestReferrerId, capTestReferrerCode, 0, Date.now()]
        );

        // Simulate 5 complete cycles (15 referrals = 5 cycles × 3 referrals)
        let totalCreditsEarned = 0;
        for (let cycle = 0; cycle < 5; cycle++) {
          for (let i = 0; i < 3; i++) {
            const refereeId = `cap_referee_c${cycle}_${i}_${Date.now()}_${Math.random()}`;
            const refereeCode = generateReferralCode();
            await db.runAsync(
              'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
              [refereeId, refereeCode, 0, Date.now()]
            );

            const result = await redeemReferralCode(refereeId, capTestReferrerCode);
            if (!result.success) {
              throw new Error(`Failed to redeem for cycle ${cycle + 1}, referral ${i + 1}: ${result.error}`);
            }
          }
          // After each cycle of 3, should get 5 credits
          totalCreditsEarned += 5;
        }

        // Check stats after 5 cycles
        const stats = await getReferralStats(capTestReferrerId);
        const userCredits = await getUserCredits(capTestReferrerId);

        if (stats.completedCycles === 5 && stats.maxCycles === 5) {
          if (userCredits === 25) {
            updateTest(13, {
              status: 'passed',
              message: '5 Cycle cap works correctly',
              details: `Completed ${stats.completedCycles}/${stats.maxCycles} cycles\nTotal referrals: ${stats.totalReferrals}/15\nCredits earned: ${userCredits}/25`
            });
          } else {
            throw new Error(`Expected 25 credits, got ${userCredits}`);
          }
        } else {
          throw new Error(`Expected 5/5 cycles, got ${stats.completedCycles}/${stats.maxCycles}`);
        }

        // Try to add a 16th referral - should still work but not award credits
        const extraRefereeId = `extra_referee_${Date.now()}_${Math.random()}`;
        const extraRefereeCode = generateReferralCode();
        await db.runAsync(
          'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
          [extraRefereeId, extraRefereeCode, 0, Date.now()]
        );

        const extraResult = await redeemReferralCode(extraRefereeId, capTestReferrerCode);
        if (extraResult.success) {
          // Check that credits didn't increase
          const finalCredits = await getUserCredits(capTestReferrerId);
          if (finalCredits === 25) {
            updateTest(13, {
              status: 'passed',
              message: '5 Cycle cap works correctly (16th referral blocked)',
              details: `Completed ${stats.completedCycles}/${stats.maxCycles} cycles\nTotal referrals: ${stats.totalReferrals + 1}/15\nCredits capped at: ${finalCredits}/25\n16th referral accepted but no credits awarded`
            });
          } else {
            throw new Error(`Credits should stay at 25, but got ${finalCredits}`);
          }
        }
      } catch (error: any) {
        updateTest(13, {
          status: 'failed',
          message: '5 Cycle cap test failed',
          details: error.message
        });
      }

    } catch (error: any) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTests([
      { name: 'Database Connection', status: 'pending' },
      { name: 'Generate Referral Code', status: 'pending' },
      { name: 'Create User with Referral Code', status: 'pending' },
      { name: 'Referral Code Uniqueness', status: 'pending' },
      { name: 'Redeem Referral Code', status: 'pending' },
      { name: 'Prevent Self-Referral', status: 'pending' },
      { name: 'Prevent Double Redemption', status: 'pending' },
      { name: 'Track Referral Progress (1/3)', status: 'pending' },
      { name: 'Track Referral Progress (2/3)', status: 'pending' },
      { name: 'Award Credits at 3 Referrals', status: 'pending' },
      { name: 'Reset Progress After Reward', status: 'pending' },
      { name: 'Use Credits', status: 'pending' },
      { name: 'Get Referred Users', status: 'pending' },
      { name: 'Test 5 Cycle Cap (15 referrals max)', status: 'pending' },
    ]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
      case 'failed':
        return <Ionicons name="close-circle" size={20} color="#ef4444" />;
      case 'running':
        return <Ionicons name="refresh" size={20} color="#3b82f6" />;
      default:
        return <View className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center mb-3"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text className="ml-2 text-lg font-semibold">Backend Tests</Text>
        </TouchableOpacity>

        {passedTests > 0 && (
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600">
              {passedTests}/{tests.length} tests passed
            </Text>
            {failedTests > 0 && (
              <Text className="text-sm text-red-600 ml-2">
                • {failedTests} failed
              </Text>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Test Results */}
        <View className="mb-6">
          {tests.map((test, index) => (
            <View
              key={index}
              className={`mb-3 p-4 border rounded-2xl ${getStatusColor(test.status)}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold flex-1">{test.name}</Text>
                {getStatusIcon(test.status)}
              </View>

              {test.message && (
                <Text className="text-sm text-gray-600 mb-1">{test.message}</Text>
              )}

              {test.details && (
                <View className="mt-2 p-3 bg-white rounded-lg">
                  <Text className="text-xs text-gray-500 font-mono">
                    {test.details}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Info Box */}
        <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <Text className="text-sm text-blue-900 font-semibold mb-2">
            What This Tests
          </Text>
          <Text className="text-sm text-blue-800">
            • Database connection and initialization{'\n'}
            • Referral code generation and uniqueness{'\n'}
            • User creation with referral codes{'\n'}
            • Referral redemption and validation{'\n'}
            • Self-referral and double redemption prevention{'\n'}
            • Progress tracking (1/3, 2/3, 3/3){'\n'}
            • Credit rewards at 3 referrals{'\n'}
            • Progress reset after reward{'\n'}
            • Credit usage functionality{'\n'}
            • Referred users retrieval
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-6 py-4 border-t border-gray-200">
        {!isRunning ? (
          <View className="gap-3">
            <TouchableOpacity
              onPress={runAllTests}
              className="bg-black py-4 rounded-full items-center"
            >
              <Text className="text-white font-semibold text-base">
                {passedTests > 0 ? 'Run Tests Again' : 'Run All Tests'}
              </Text>
            </TouchableOpacity>

            {passedTests > 0 && (
              <TouchableOpacity
                onPress={resetTests}
                className="border-2 border-gray-300 py-4 rounded-full items-center"
              >
                <Text className="text-black font-semibold text-base">Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="bg-gray-100 py-4 rounded-full items-center">
            <Text className="text-gray-500 font-semibold text-base">
              Running Tests...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
