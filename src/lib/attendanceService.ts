import apiClient from "@/lib/apiClient";
import { ApiResponse, PaginatedData } from "@/types/api";
import { handleApiCall } from "@/lib/utils";
import {
   AttendanceFilterParams,
   BulkMarkAttendancePayload,
   BulkMarkAttendanceResult,
   CreateAttendanceSessionPayload,
   IAttendanceSession,
   MarkAttendancePayload,
   UpdateAttendanceSessionPayload,
} from "@/types/attendance";
import { UpsertIncomePayload } from "@/types/income";
import { IUser } from "@/types/user";

const buildFilterQuery = (filters?: AttendanceFilterParams) => {
   if (!filters) return undefined;
   const params: Record<string, string> = {};
   if (filters.departmentIds && filters.departmentIds.length > 0) {
      params.departmentIds = filters.departmentIds.join(",");
   }
   if (filters.gender) params.gender = filters.gender;
   if (filters.membershipType) params.membershipType = filters.membershipType;
   if (filters.churchStatus) params.churchStatus = filters.churchStatus;
   if (filters.lateComers) params.lateComers = "true";
   if (filters.serviceOrder) params.serviceOrder = String(filters.serviceOrder);
   return params;
};

const triggerBlobDownload = (blob: Blob, filename: string) => {
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);
};

export const attendanceService = {
   startSession: (payload: CreateAttendanceSessionPayload) =>
      handleApiCall<IAttendanceSession>(
         () =>
            apiClient.post<ApiResponse<IAttendanceSession>>(
               "/attendance/session",
               payload,
            ),
         "Session started successfully!",
      ),

   markAttendance: (payload: MarkAttendancePayload) => {
      console.log("Marking attendance with payload:", payload);
      handleApiCall<{ success: boolean }>(
         () =>
            apiClient.post<ApiResponse<{ success: boolean }>>(
               "/attendance/mark",
               payload,
            ),
         "Attendance recorded!",
      );
   },

   bulkMarkAttendance: (payload: BulkMarkAttendancePayload) =>
      handleApiCall<BulkMarkAttendanceResult>(
         () =>
            apiClient.post<ApiResponse<BulkMarkAttendanceResult>>(
               "/attendance/mark-bulk",
               payload,
            ),
         "Bulk attendance marked!",
      ),

   getAllSessions: (params?: { page?: number; limit?: number }) =>
      handleApiCall<PaginatedData<IAttendanceSession>>(() =>
         apiClient.get<ApiResponse<PaginatedData<IAttendanceSession>>>(
            "/attendance/sessions",
            { params },
         ),
      ),

   getSessionById: (id: string, filters?: AttendanceFilterParams) =>
      handleApiCall<IAttendanceSession>(() =>
         apiClient.get<ApiResponse<IAttendanceSession>>(
            `/attendance/session/${id}`,
            { params: buildFilterQuery(filters) },
         ),
      ),

   exportSessionPdf: async (
      id: string,
      sessionName: string,
      filters?: AttendanceFilterParams,
   ) => {
      const response = await apiClient.get(`/attendance/session/${id}/pdf`, {
         params: buildFilterQuery(filters),
         responseType: "blob",
      });
      const safeName = sessionName.replace(/[^a-z0-9_-]+/gi, "_") || "session";
      const dateLabel = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(
         response.data as Blob,
         `${safeName}_${dateLabel}.pdf`,
      );
   },

   updateSession: (id: string, payload: UpdateAttendanceSessionPayload) =>
      handleApiCall<IAttendanceSession>(
         () =>
            apiClient.put<ApiResponse<IAttendanceSession>>(
               `/attendance/session/${id}`,
               payload,
            ),
         "Session updated!",
      ),

   deleteSession: (id: string) =>
      handleApiCall<{ success: boolean }>(
         () =>
            apiClient.delete<ApiResponse<{ success: boolean }>>(
               `/attendance/session/${id}`,
            ),
         "Session deleted!",
      ),

   upsertSessionIncome: (id: string, payload: UpsertIncomePayload) =>
      handleApiCall<IAttendanceSession>(
         () =>
            apiClient.put<ApiResponse<IAttendanceSession>>(
               `/attendance/session/${id}/income`,
               payload,
            ),
         "Income saved!",
      ),

   closeSession: (id: string) =>
      handleApiCall<IAttendanceSession>(
         () =>
            apiClient.post<ApiResponse<IAttendanceSession>>(
               `/attendance/session/${id}/close`,
            ),
         "Session closed.",
      ),

   reopenSession: (id: string) =>
      handleApiCall<IAttendanceSession>(
         () =>
            apiClient.post<ApiResponse<IAttendanceSession>>(
               `/attendance/session/${id}/reopen`,
            ),
         "Session reopened.",
      ),
};

export const authService = {
   register: (payload: Record<string, unknown>) =>
      handleApiCall<{ user: IUser }>(
         () =>
            apiClient.post<ApiResponse<{ user: IUser }>>(
               "/auth/register",
               payload,
            ),
         "User registered!",
      ),
};
