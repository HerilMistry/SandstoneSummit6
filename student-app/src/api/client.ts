import axios from 'axios';

// ⚠️ Change this to your deployed backend URL before building
// For local dev with Expo Go: use your machine's LAN IP, e.g. http://192.168.1.10:3001
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
