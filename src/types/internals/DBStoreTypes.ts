import IndexedDBService from "@/services/IndexedDBService";

export interface UserConfig {
    id: number;
    user_name: string;
    user_avatar: string;
    user_state: string;
    createdAt?: string;
}

export interface Network {
    id?: number;
    network_name: string | null;
    network_id: number;
}

export interface DBStore {
    // State
    isInitialized: boolean;
    configVersion: number;
    selfConfig: UserConfig | null;
    currentDBName: string;
    dbService: IndexedDBService | null;

    // State setters
    setIsInitialized: (initialized: boolean) => void;
    setConfigVersion: (version: number) => void;
    setDBService: (service: IndexedDBService) => void;
    setSelfConfig: (config: UserConfig | null) => void;
    setCurrentDBName: (name: string) => void;

    // Database operations
    deleteDatabase: () => Promise<void>;
    
    // User config operations
    getUserConfig: () => Promise<UserConfig>;
    updateUserConfig: (config: Partial<UserConfig>) => Promise<UserConfig>;
    resetUserConfig: () => Promise<UserConfig>;

    // Network operations
    getAllNetworks: () => Promise<Network[]>;
    updateNetwork: (network: Network) => Promise<boolean>;
    deleteNetwork: (networkId: number) => Promise<boolean>;
}
