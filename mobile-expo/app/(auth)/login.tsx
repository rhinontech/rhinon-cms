import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Mimic login for now, will connect to API later
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8">
          <View className="flex-1 justify-center py-12">
            {/* Logo placeholder */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 bg-indigo-600 rounded-3xl items-center justify-center shadow-lg shadow-indigo-500/50 mb-6">
                <MaterialCommunityIcons name="text" size={48} color="white" />
              </View>
              <Text className="text-white text-3xl font-bold mb-2">Rhinon CMS</Text>
              <Text className="text-slate-400 text-center">Private Operations & Outbound Engine</Text>
            </View>

            {/* Form */}
            <View className="space-y-6">
              <View>
                <Text className="text-slate-400 text-sm font-medium mb-2 ml-1">Email Address</Text>
                <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <MaterialCommunityIcons name="email-outline" size={20} color="#64748B" />
                  <TextInput
                    className="flex-1 ml-3 text-typography-900 text-base"
                    placeholder="name@company.com"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-slate-400 text-sm font-medium mb-2 ml-1">Password</Text>
                <View className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 flex-row items-center">
                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748B" />
                  <TextInput
                    className="flex-1 ml-3 text-typography-900 text-base"
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity className="items-end mt-2">
                <Text className="text-indigo-400 font-medium">Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`w-full bg-indigo-600 py-4 rounded-2xl items-center mt-8 ${loading ? 'opacity-70' : ''}`}
              >
                <Text className="text-primary-0 text-lg font-bold">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="pb-8 items-center">
            <Text className="text-slate-500 text-sm">
              Exclusive for internal team members.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
