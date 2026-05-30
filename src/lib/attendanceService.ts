import apiClient from "@/lib/apiClient";
import { ApiResponse, PaginatedData } from "@/types/api";
import { handleApiCall } from "@/lib/utils";
import {
    BulkMarkAttendancePayload,
    BulkMarkAttendanceResult,
    CreateAttendanceSessionPayload,
    IAttendanceSession,
    MarkAttendancePayload,
    UpdateAttendanceSessionPayload,
} from "@/types/attendance";
import { IUser } from "@/types/user";

export const attendanceService = {
    startSession: (payload: CreateAttendanceSessionPayload) =>
        handleApiCall<IAttendanceSession>(
            () => apiClient.post<ApiResponse<IAttendanceSession>>("/attendance/session", payload),
            "Session started successfully!"
        ),

    markAttendance: (payload: MarkAttendancePayload) => {
        console.log("Marking attendance with payload:", payload);
        handleApiCall<{ success: boolean }>(
            () => apiClient.post<ApiResponse<{ success: boolean }>>("/attendance/mark", payload),
            "Attendance recorded!"
        )
    },

    bulkMarkAttendance: (payload: BulkMarkAttendancePayload) =>
        handleApiCall<BulkMarkAttendanceResult>(
            () => apiClient.post<ApiResponse<BulkMarkAttendanceResult>>("/attendance/mark-bulk", payload),
            "Bulk attendance marked!"
        ),

    getAllSessions: (params?: { page?: number; limit?: number }) =>
        handleApiCall<PaginatedData<IAttendanceSession>>(
            () => apiClient.get<ApiResponse<PaginatedData<IAttendanceSession>>>("/attendance/sessions", { params })
        ),

    getSessionById: (id: string) =>
        handleApiCall<IAttendanceSession>(
            () => apiClient.get<ApiResponse<IAttendanceSession>>(`/attendance/session/${id}`)
        ),

    updateSession: (id: string, payload: UpdateAttendanceSessionPayload) =>
        handleApiCall<IAttendanceSession>(
            () => apiClient.put<ApiResponse<IAttendanceSession>>(`/attendance/session/${id}`, payload),
            "Session updated!"
        ),

    deleteSession: (id: string) =>
        handleApiCall<{ success: boolean }>(
            () => apiClient.delete<ApiResponse<{ success: boolean }>>(`/attendance/session/${id}`),
            "Session deleted!"
        ),
};

export const authService = {
    register: (payload: Record<string, unknown>) =>
        handleApiCall<{ user: IUser }>(
            () => apiClient.post<ApiResponse<{ user: IUser }>>("/auth/register", payload),
            "User registered!"
        ),
};
