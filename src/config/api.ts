import { Platform } from 'react-native';
import * as Network from 'expo-network';

// For development: Replace this with your computer's local IP address
// To find your IP:
// - Windows: ipconfig (look for IPv4 Address under your active network adapter)
// - Mac/Linux: ifconfig or ip addr (look for inet under your active network adapter)
// Example: '192.168.1.100'
const LOCAL_IP = '192.168.1.100'; // ⚠️ CHANGE THIS TO YOUR LOCAL IP ADDRESS

const BACKEND_PORT = 3000;

// Determine the API base URL
export const getApiUrl = () => {
  if (__DEV__) {
    // In development, use your local IP address
    return `http://${LOCAL_IP}:${BACKEND_PORT}`;
  } else {
    // In production, use your deployed backend URL
    return 'https://your-production-api.com';
  }
};

export const API_BASE_URL = getApiUrl();

// Helper function to get network info (for debugging)
export const getNetworkInfo = async () => {
  try {
    const ipAddress = await Network.getIpAddressAsync();
    return {
      ipAddress,
      apiUrl: API_BASE_URL,
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return {
      ipAddress: 'unknown',
      apiUrl: API_BASE_URL,
    };
  }
};


