import "isomorphic-fetch";
import { XRD, XRDPresence } from "./xrd";
import { Credentials } from './auth';
export declare class Api {
    private authManager;
    protected credentials: Credentials;
    constructor(credentials: Credentials, skipRefresh: boolean);
}
export declare class XRDApi extends Api {
    list(): Promise<Array<XRD>>;
    updateXRD(xrdId: string, updateData: any): Promise<any>;
    registerXRD(hardwareId: string): Promise<any>;
    getXRDConfig(hardwareId: string): Promise<any>;
    presence(): Promise<Array<XRDPresence>>;
    health(): Promise<boolean>;
}
