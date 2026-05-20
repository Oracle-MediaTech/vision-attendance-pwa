import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApiResponse } from '@/types/api';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function handleApiCall<T>(
  apiCall: () => Promise<{ data: ApiResponse<T> }>,
  successMessage?: string
): Promise<T> {
  try {
    const { data } = await apiCall();
    if (!data.data) throw new Error(data.message || "Unexpected server response");
    if (successMessage) {
      toast.success(successMessage);
    }
    return data.data;
  } catch (error: any) {
    const errMessage =
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";
    toast.error(errMessage);
    throw new Error(errMessage);
  }
}
