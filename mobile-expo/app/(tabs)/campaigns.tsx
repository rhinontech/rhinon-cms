import { View, Text, ScrollView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/utils/api';
import { Campaign } from '@/utils/types';

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/campaigns');
      if (Array.isArray(data)) {
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={['top']}>
      <View className="px-6 pt-4 pb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-typography-950 text-2xl font-bold mb-1">Campaigns</Text>
          <Text className="text-typography-500">Orchestrate your outreach</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center">
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#6366F1" size="large" />
          <Text className="text-slate-500 mt-4">Loading campaigns...</Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={({ item }) => <CampaignItem campaign={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <MaterialCommunityIcons name="bullhorn-outline" size={64} color="#1e293b" />
              <Text className="text-slate-500 mt-4 text-center">
                No campaigns found. Click the + button to create one.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function CampaignItem({ campaign }: { campaign: Campaign }) {
  const progress = campaign.leadsTotal > 0 ? (campaign.leadsProcessed / campaign.leadsTotal) * 100 : 0;
  
  return (
    <TouchableOpacity className="bg-background-50 p-5 rounded-3xl border border-outline-100 mb-5">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-3">
          <Text className="text-typography-950 font-bold text-lg mb-1">{campaign.name}</Text>
          <View className="flex-row items-center gap-2">
            <View className="px-2 py-0.5 bg-slate-800 rounded-lg">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {campaign.channel}
              </Text>
            </View>
            <Text className="text-slate-500 text-xs">{campaign.stage}</Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${campaign.stage === 'Active' ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
          <Text className={`text-[10px] font-bold uppercase ${campaign.stage === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
            {campaign.stage}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-typography-500 text-xs">Progress</Text>
          <Text className="text-typography-950 text-xs font-semibold">{campaign.leadsProcessed} / {campaign.leadsTotal}</Text>
        </View>
        <View className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <View 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-slate-500 text-[10px]">Daily Limit: {campaign.dailyLimit}</Text>
        <TouchableOpacity className="flex-row items-center gap-1">
          <Text className="text-indigo-400 text-xs font-semibold">Details</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#818cf8" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
