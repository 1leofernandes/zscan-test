import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from './api-client';
import { LoginSchema, SignupSchema } from '../schemas';

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: async (data: LoginSchema) => {
      console.log('🔵 MutationFn called with:', data); // Debug
      const payload = {
        email: data.email,
        password: data.password,
        ...(data.tenantId && { tenantId: data.tenantId })
      };
      console.log('🔵 Sending payload:', payload); // Debug
      console.log('🔵 API URL:', apiClient.defaults.baseURL); // Debug
      
      const response = await apiClient.post('/auth/login', payload);
      console.log('🟢 API Response:', response.data); // Debug
      return response.data;
    },
    onSuccess: (data) => {
      console.log('🟢 Login success, saving tokens...', data);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      // Salvar tenantId do nível raiz da resposta
      if (data.tenantId) {
        localStorage.setItem('tenantId', data.tenantId);
        console.log('🟢 Tenant ID saved:', data.tenantId);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
    },
    onError: (error: any) => {
      console.error('🔴 Login mutation error:', error);
      console.error('🔴 Error response:', error.response?.data);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupSchema) => {
      const { confirmPassword, ...rest } = data;
      const response = await apiClient.post('/auth/signup', rest);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.tenantId) {
        localStorage.setItem('tenantId', data.tenantId);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
  }, []);

  return {
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    signupError: signupMutation.error,
    logout,
  };
};
