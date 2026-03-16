import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <View>
          <Text className="text-typography-500 text-sm font-medium uppercase tracking-wider">Command Center</Text>
          <Text className="text-typography-950 text-2xl font-bold">Rhinon CMS</Text>
        </View>

        <TouchableOpacity className="w-12 h-12 bg-background-50 rounded-full items-center justify-center border border-outline-100">
          <MaterialCommunityIcons name="bell-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Metric Cards Row */}
        <View className="px-6 flex-row flex-wrap justify-between gap-y-4 mb-8">
          <MetricCard 
            title="Total Leads" 
            value="1,248" 
            icon="account-group" 
            color="#6366F1"
            percentage="+12%"
          />
          <MetricCard 
            title="Emails Sent" 
            value="856" 
            icon="email-send" 
            color="#ec4899"
            percentage="+5%"
          />
          <MetricCard 
            title="Reply Rate" 
            value="14.2%" 
            icon="reply-all" 
            color="#10b981"
            percentage="+2.4%"
          />
          <MetricCard 
            title="Campaigns" 
            value="8" 
            icon="bullhorn" 
            color="#f59e0b"
            percentage="Active"
          />
        </View>

        {/* Recent Activity */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-typography-950 text-xl font-bold">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-indigo-400 font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <ActivityItem 
            title="Campaign 'Q3 Outreach' Finished" 
            time="2 hours ago" 
            description="Processed 500 leads successfully."
            icon="check-circle"
            iconColor="#10b981"
          />
          <ActivityItem 
            title="New Lead Replied" 
            time="4 hours ago" 
            description="John Doe from Acme Corp replied to your email."
            icon="message-text"
            iconColor="#6366F1"
          />
          <ActivityItem 
            title="Import Completed" 
            time="Yesterday" 
            description="250 leads uploaded to 'Real Estate' list."
            icon="upload"
            iconColor="#f59e0b"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ title, value, icon, color, percentage }: any) {
  return (
    <View className="w-[48%] bg-background-50 p-4 rounded-2xl border border-outline-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="p-2 rounded-lg bg-background-0 border border-outline-100">
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text className="text-slate-500 text-xs font-medium">{percentage}</Text>
      </View>
      <Text className="text-typography-500 text-xs font-medium mb-1">{title}</Text>
      <Text className="text-typography-950 text-xl font-bold">{value}</Text>
    </View>
  );
}

function ActivityItem({ title, time, description, icon, iconColor }: any) {
  return (
    <View className="flex-row gap-4 mb-6">
      <View className="w-10 h-10 rounded-full bg-background-50 border border-outline-100 items-center justify-center">
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-typography-950 font-semibold">{title}</Text>
          <Text className="text-typography-500 text-xs">{time}</Text>
        </View>
        <Text className="text-typography-500 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}
