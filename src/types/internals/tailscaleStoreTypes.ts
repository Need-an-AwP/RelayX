export type IPs = {
    ipv4?: string
    ipv6?: string
}

export interface TailscaleStore {
    // stats
    isInitialized: boolean
    status: TailscaleStatus | null
    selfIPs: IPs
    selfID: number | null
    networkID: number | null
    loginName: string | null
    isTailscaleAuthKey: boolean

    // actions
    setIsInitialized: (isInitialized: boolean) => void
    setStatus: (status: TailscaleStatus | null) => void
    setSelfIPs: (ips: IPs) => void
    setSelfID: (id: number | null) => void
    setNetworkID: (id: number | null) => void
    setLoginName: (name: string | null) => void
    setIsTailscaleAuthKey: (isAuthKey: boolean) => void
}

export interface TailscaleStatus {
    AuthURL: string;
    BackendState: string;
    CertDomains: null | string[];
    ClientVersion: string | null;
    CurrentTailnet: CurrentTailnet;
    HaveNodeKey: boolean;
    Health: any[];
    MagicDNSSuffix: string;
    Peer: Record<string, PeerData>;
    Self: SelfData;
    TUN: boolean;
    TailscaleIPs: string[];
    User: Record<string, UserData>;
    Version: string;
}

export type CurrentTailnet = {
    MagicDNSEnabled: boolean
    MagicDNSSuffix: string
    Name: string
}

export interface SelfData {
    Active: boolean;
    Addrs: string[];
    AllowedIPs: string[];
    CapMap: {
        [key: string]: any
    };
    Capabilities: string[];
    Created: string;  // ISO 8601 时间格式
    CurAddr: string;
    DNSName: string;
    ExitNode: boolean;
    ExitNodeOption: boolean;
    HostName: string;
    ID: string;
    InEngine: boolean;
    InMagicSock: boolean;
    InNetworkMap: boolean;
    LastHandshake: string;  // ISO 8601 时间格式
    LastSeen: string;      // ISO 8601 时间格式
    LastWrite: string;     // ISO 8601 时间格式
    OS: string;
    Online: boolean;
    PeerAPIURL: string[];
    PublicKey: string;
    Relay: string;
    RxBytes: number;
    TailscaleIPs: string[];
    TxBytes: number;
    UserID: number;
}

export interface PeerData {
    Active: boolean;
    Addrs: null | string[];
    AllowedIPs: string[];
    Capabilities: string[];
    Created: string;
    CurAddr: string;
    DNSName: string;
    ExitNode: boolean;
    ExitNodeOption: boolean;
    HostName: string;
    ID: string;
    InEngine: boolean;
    InMagicSock: boolean;
    InNetworkMap: boolean;
    LastHandshake: string;
    LastSeen: string;
    LastWrite: string;
    OS: string;
    Online: boolean;
    PeerAPIURL: string[];
    PublicKey: string;
    Relay: string;
    RxBytes: number;
    TailscaleIPs: string[];
    TxBytes: number;
    UserID: number;
}

export interface UserData {
    DisplayName: string
    ID: number
    LoginName: string
    ProfilePicURL: string
    Roles: any[]
}