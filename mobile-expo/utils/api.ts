import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the host machine's IP for physical devices or Android emulator
const getBaseUrl = () => {
  if (__DEV__) {
    // If using Android Emulator
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    // If using iOS Simulator or physical device on same network
    // You might need to change this to your computer's IP if testing on a physical device
    return 'http://localhost:3000';
  }
  return 'https://your-production-url.com'; // Change for production
};

export const BASE_URL = getBaseUrl();

export const api = {
  get: async (endpoint: string, options = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options,
      },
    });
    return response.json();
  },
  post: async (endpoint: string, body: any, options = {}) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options,
      },
      body: JSON.stringify(body),
    });
    return response.json();
  },
};
