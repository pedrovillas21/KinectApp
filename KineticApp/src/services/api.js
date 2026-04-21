import axios from 'axios';
import { SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY } from '@env';

// Mock behavior initially to ensure no broken imports before .env is set properly
// This acts as a placeholder structure for future implementations
const api = axios.create({
  baseURL: SUPABASE_URL || 'https://api.mocked-kinect.com',
  headers: {
    'Content-Type': 'application/json',
    ...(SUPABASE_KEY ? { 'Authorization': `Bearer ${SUPABASE_KEY}` } : {})
  }
});

export const getGeminiKey = () => GEMINI_API_KEY || '';

export default api;
