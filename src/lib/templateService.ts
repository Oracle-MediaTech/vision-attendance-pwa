import apiClient from "@/lib/apiClient";
import { ApiResponse } from "@/types/api";
import { handleApiCall } from "@/lib/utils";
import { IServiceDay, ISpecialProgram } from "@/types/template";

export const serviceDayService = {
    list: () =>
        handleApiCall<IServiceDay[]>(
            () => apiClient.get<ApiResponse<IServiceDay[]>>("/service-days"),
        ),
};

export const specialProgramService = {
    list: () =>
        handleApiCall<ISpecialProgram[]>(
            () => apiClient.get<ApiResponse<ISpecialProgram[]>>("/special-programs"),
        ),
};
