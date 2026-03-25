import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Match {
    id: string;
    title: string;
    missing: bigint;
    createdAt: bigint;
    time: string;
    sport: string;
    location: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMatch(sport: string, title: string, time: string, location: string, missing: bigint): Promise<string>;
    deleteMatch(id: string): Promise<void>;
    getAllMatches(): Promise<Array<Match>>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    joinMatch(id: string): Promise<void>;
    searchMatchesByLocation(location: string): Promise<Array<Match>>;
    searchMatchesBySport(sport: string): Promise<Array<Match>>;
}
