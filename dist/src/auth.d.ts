import "isomorphic-fetch";
export interface Credentials {
    token: string;
    refresh: string;
    user: {
        id: number;
    };
}
export declare const auth: (email: string, password: string) => Promise<Credentials>;
export declare const refresh: (refreshToken: string) => Promise<Credentials>;
export declare class AuthManager {
    private scheduledRefresh?;
    constructor();
    scheduleRefresh(accessToken: string, refreshToken: string, credentialsCallback: Function): Promise<void>;
}
