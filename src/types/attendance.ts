import { IUser } from "./user";

export interface ISessionService {
    id: string;
    sessionId: string;
    order: number;
    serviceTime: string;
    preServiceTime?: string | null;
    closesAt?: string | null;
}

export interface SessionServiceInput {
    order: number;
    serviceTime: string;
    preServiceTime?: string | null;
    closesAt?: string | null;
}

export interface IAttendanceSession {
    id: string;
    serviceName: string;
    date?: Date;
    startedAt?: Date;
    endedAt?: Date;
    services?: ISessionService[];
    attendees?: IAttendance[];
    createdAt: Date;
}

export interface IAttendance {
    id: string;
    sessionId: string;
    userId: string;
    session?: IAttendanceSession;
    user?: IUser;
    markedAt: Date;
    serviceOrder: number;
}

export interface CreateAttendanceSessionPayload {
    serviceName: string;
    date?: string;
    startedAt: string;
    services: SessionServiceInput[];
}

export interface UpdateAttendanceSessionPayload {
    serviceName?: string;
    date?: string;
    services?: SessionServiceInput[];
}

export interface AttendanceFilterParams {
    departmentIds?: string[];
    gender?: "MALE" | "FEMALE";
    membershipType?: "WORKER" | "NON_WORKER";
    churchStatus?: "FIRST_TIMER" | "VISITOR" | "MEMBER";
    lateComers?: boolean;
    serviceOrder?: number;
}

export interface MarkAttendancePayload {
    userId: string;
    sessionId: string;
    markedAt?: Date;
    serviceOrder?: number;
}

export interface BulkMarkAttendancePayload {
    sessionId: string;
    userIds: string[];
}

export interface BulkMarkAttendanceResult {
    marked: number;
    alreadyPresent: number;
}
