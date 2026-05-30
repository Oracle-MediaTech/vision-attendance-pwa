import { ApiResponse, PaginatedData } from "@/types/api";
import { handleApiCall } from "./utils";
import { IUser } from "@/types/user";
import apiClient from "./apiClient";

export const userService = {
    getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
        handleApiCall<PaginatedData<IUser>>(
            () => apiClient.get<ApiResponse<PaginatedData<IUser>>>("/users", { params })
        ),

    searchUsers: (name: string) =>
        handleApiCall<IUser[]>(
            () => apiClient.get<ApiResponse<IUser[]>>("/user/search", { params: { name } })
        ),

    getUser: (id: string) =>
        handleApiCall<IUser>(
            () => apiClient.get<ApiResponse<IUser>>(`/user/${id}`)
        ),
};