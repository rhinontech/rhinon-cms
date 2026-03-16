import { View, Text, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={['top']}>
      <View className="px-6 pt-4 pb-6">
        <Text className="text-typography-950 text-2xl font-bold mb-1">Settings</Text>
        <Text className="text-typography-500">Configure your workspace</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="px-6 mb-8">
          <View className="bg-background-50 p-6 rounded-3xl border border-outline-100 items-center">
            <View className="w-24 h-24 rounded-full bg-indigo-600 items-center justify-center mb-4 border-4 border-background-0 overflow-hidden">
              <MaterialCommunityIcons name="account" size={60} color="white" />
            </View>
            <Text className="text-typography-950 text-xl font-bold">Admin Account</Text>
            <Text className="text-typography-500 mb-4">admin@rhinon.site</Text>
            <TouchableOpacity className="bg-slate-800 px-6 py-2 rounded-xl border border-slate-700">
              <Text className="text-white font-semibold">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences */}
        <View className="px-6 mb-8">
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Preferences</Text>
          <View className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            <SettingToggle 
              icon="bell-outline" 
              title="Push Notifications" 
              value={notifications} 
              onValueChange={setNotifications} 
            />
            <View className="h-[1px] bg-slate-800 mx-4" />
            <SettingToggle 
              icon="fingerprint" 
              title="Biometric Login" 
              value={biometrics} 
              onValueChange={setBiometrics} 
            />
            <View className="h-[1px] bg-slate-800 mx-4" />
            <SettingLink icon="translate" title="Language" value="English" />
          </View>
        </View>

        {/* Workspace */}
        <View className="px-6 mb-8">
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 ml-2">Workspace</Text>
          <View className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            <SettingLink icon="account-group-outline" title="Team Management" />
            <View className="h-[1px] bg-slate-800 mx-4" />
            <SettingLink icon="database-outline" title="Data Usage" />
            <View className="h-[1px] bg-slate-800 mx-4" />
            <SettingLink icon="shield-check-outline" title="Security & Privacy" />
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-6 pb-12">
          <TouchableOpacity className="bg-rose-500/10 py-4 rounded-2xl border border-rose-500/20 items-center flex-row justify-center gap-2">
            <MaterialCommunityIcons name="logout" size={20} color="#f43f5e" />
            <Text className="text-rose-500 font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({ icon, title, value, onValueChange }: any) {
  return (
    <View className="flex-row items-center justify-between p-4 px-5">
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 bg-background-0 rounded-xl items-center justify-center border border-outline-100">
          <MaterialCommunityIcons name={icon} size={20} color="#6366F1" />
        </View>
        <Text className="text-typography-950 font-medium">{title}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: '#1e293b', true: '#4f46e5' }}
        thumbColor={value ? '#ffffff' : '#94a3b8'}
      />
    </View>
  );
}

function SettingLink({ icon, title, value }: any) {
  return (
    <TouchableOpacity className="flex-row items-center justify-between p-4 px-5">
      <View className="flex-row items-center gap-4">
        <View className="w-10 h-10 bg-background-0 rounded-xl items-center justify-center border border-outline-100">
          <MaterialCommunityIcons name={icon} size={20} color="#6366F1" />
        </View>
        <Text className="text-typography-950 font-medium">{title}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && <Text className="text-slate-500 text-sm">{value}</Text>}
        <MaterialCommunityIcons name="chevron-right" size={20} color="#334155" />
      </View>
    </TouchableOpacity>
  );
}
