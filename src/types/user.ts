import { IAttendance } from "./attendance";

export type Gender = "MALE" | "FEMALE";
export type ChurchStatus = "FIRST_TIMER" | "VISITOR" | "MEMBER";
export type MembershipType = "NON_WORKER" | "WORKER";
export type WorkerType = "REGULAR" | "EXECUTIVE";
export type UserRole = "MEMBER" | "WORKER" | "ADMIN";

export interface IDepartment {
    id: string;
    name: string;
    description?: string;
}
export interface IUser {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    gender: Gender;
    address: string;
    dateOfBirth?: Date;
    department?: string;
    level?: string;
    faculty?: string;
    churchStatus: ChurchStatus;
    membershipType?: MembershipType;
    workerType?: WorkerType;
    role?: UserRole;
    attendances?: IAttendance[];
    departments?: IDepartment[];
    createdAt?: Date;
    updatedAt?: Date;
}
