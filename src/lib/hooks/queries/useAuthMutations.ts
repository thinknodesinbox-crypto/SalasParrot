import { useMutation } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../api';

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

interface ChangePasswordResponse {
  message: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await api.post<ChangePasswordResponse>('/auth/change-password', data);
      return response.data;
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
};
