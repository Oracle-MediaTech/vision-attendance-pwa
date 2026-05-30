import { ApiResponse, PaginatedData } from '@/types/api';
import { IDepartment } from '@/types/user';
import { handleApiCall } from './utils';
import apiClient from './apiClient';
export const departmentService = {
    getAll: () =>
        handleApiCall<PaginatedData<IDepartment>>(
            () => apiClient.get<ApiResponse<PaginatedData<IDepartment>>>("/departments", { params: { limit: 100 } })
        ),
};