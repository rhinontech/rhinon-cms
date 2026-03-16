import { View, Text, ScrollView, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/utils/api';
import { Lead } from '@/utils/types';

export default function LeadsScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/leads');
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-background-0" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-typography-950 text-2xl font-bold mb-1">Leads</Text>
        <Text className="text-typography-500">Manage your outbound pipeline</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 mb-6">
        <View className="bg-background-50 border border-outline-100 rounded-2xl px-4 py-3 flex-row items-center">
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-typography-950"
            placeholder="Search name, company or email..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#6366F1" size="large" />
          <Text className="text-slate-500 mt-4">Loading leads...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id || item._id || Math.random().toString()}
          renderItem={({ item }) => <LeadItem lead={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <MaterialCommunityIcons name="account-off-outline" size={64} color="#1e293b" />
              <Text className="text-slate-500 mt-4 text-center">
                {searchQuery ? `No leads matching "${searchQuery}"` : "Your lead database is empty."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function LeadItem({ lead }: { lead: Lead }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#6366F1'; // indigo
      case 'Emailed': return '#3b82f6'; // blue
      case 'Replied': return '#10b981'; // green
      case 'Bounced': return '#ef4444'; // red
      case 'Interested': return '#f59e0b'; // amber
      default: return '#64748B'; // slate
    }
  };

  return (
    <TouchableOpacity className="bg-background-50 p-4 rounded-2xl border border-outline-100 mb-4 flex-row items-center gap-4">
      <View className="w-12 h-12 rounded-full bg-background-0 border border-outline-100 items-center justify-center">
        <Text className="text-indigo-400 font-bold text-lg">
          {lead.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-typography-950 font-semibold text-base" numberOfLines={1}>{lead.name}</Text>
          <View 
            className="px-2 py-0.5 rounded-full" 
            style={{ backgroundColor: `${getStatusColor(lead.status)}20`, borderWidth: 1, borderColor: getStatusColor(lead.status) }}
          >
            <Text style={{ color: getStatusColor(lead.status), fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>
              {lead.status}
            </Text>
          </View>
        </View>
        <Text className="text-slate-400 text-sm" numberOfLines={1}>{lead.company}</Text>
        <View className="flex-row items-center mt-2 gap-4">
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="email-outline" size={14} color="#64748B" />
            <Text className="text-slate-500 text-xs" numberOfLines={1}>{lead.email}</Text>
          </View>
        </View>
      </View>
      
      <MaterialCommunityIcons name="chevron-right" size={24} color="#334155" />
    </TouchableOpacity>
  );
}
