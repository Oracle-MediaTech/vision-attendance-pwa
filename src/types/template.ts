export type Weekday =
    | "SUNDAY"
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY";

export interface IServiceTemplate {
    id: string;
    order: number;
    serviceTime: string;
    preServiceTime?: string | null;
    closesAt?: string | null;
}

export interface IServiceDay {
    id: string;
    name: string;
    weekday: Weekday;
    services: IServiceTemplate[];
    createdAt: string;
    updatedAt: string;
}

export interface ISpecialProgram {
    id: string;
    name: string;
    date?: string | null;
    services: IServiceTemplate[];
    createdAt: string;
    updatedAt: string;
}

export const WEEKDAY_ORDER: Weekday[] = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
};
