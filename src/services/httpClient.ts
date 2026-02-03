import { apiConfig } from '@/config/api';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  timeout: apiConfig.httpTimeout,
  withCredentials: true, // Send cookies for session auth
});

export async function invoke<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const token = localStorage.getItem('token');
  const newArgs = [...args];

  // Append token if it exists and not logging in
  if (token && channel !== 'auth:login') {
    newArgs.push(token);
  }

  try {
    // Map IPC channels to HTTP endpoints
    const response = await axiosInstance.post('/api/invoke', {
      channel,
      args: newArgs,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error.message;
    }
    throw error;
  }
}
