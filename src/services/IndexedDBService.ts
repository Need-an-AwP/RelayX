import { Network, UserConfig } from '@/types';

class IndexedDBService {
    public db: IDBDatabase | null;
    private dbName: string;
    private currentNetwork: Network;
    private version: number;
    private configVersion: number;
    private setConfigVersion: (version: number) => void;

    constructor(
        currentNetwork: Network,
        configVersion: number,
        setConfigVersion: (version: number) => void,
        version = 1
    ) {
        this.dbName = "configDB";
        this.currentNetwork = currentNetwork;
        this.version = version;
        this.db = null;
        this.configVersion = configVersion;
        this.setConfigVersion = setConfigVersion;
    }

    async initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);

            // triggered when the database is being created or upgraded
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('userConfig')) {
                    const userConfigStore = db.createObjectStore('userConfig', { keyPath: 'id', autoIncrement: true });
                    userConfigStore.createIndex('user_name', 'user_name', { unique: false });
                    userConfigStore.createIndex('user_avatar', 'user_avatar', { unique: false });
                    userConfigStore.createIndex('user_state', 'user_state', { unique: false });

                    userConfigStore.add({
                        user_name: "default_User_Name",
                        user_avatar: "https://github.com/shadcn.png",
                        user_state: "default_User_State",
                    });
                }

                if (!db.objectStoreNames.contains('networks')) {
                    const networksStore = db.createObjectStore('networks', { keyPath: 'id', autoIncrement: true });
                    networksStore.createIndex('network_name', 'network_name', { unique: false });
                    networksStore.createIndex('network_id', 'network_id', { unique: true });

                    networksStore.add(this.currentNetwork);
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
        });
    }

    // network operations
    async addNetwork(network: Network): Promise<IDBValidKey> {
        if (!this.db) throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['networks'], 'readwrite');
            const store = transaction.objectStore('networks');
            const request = store.add(network);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllNetworks(): Promise<Network[]> {
        if (!this.db) throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['networks'], 'readonly');
            const store = transaction.objectStore('networks');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateNetwork(network: Network): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['networks'], 'readwrite');
            const store = transaction.objectStore('networks');
            const request = store.put(network);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNetwork(networkId: number): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['networks'], 'readwrite');
            const store = transaction.objectStore('networks');
            const request = store.delete(networkId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // config operations
    async getUserConfig(): Promise<UserConfig> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction(['userConfig'], 'readonly');
            const store = transaction.objectStore('userConfig');
            const request = store.getAll();

            request.onsuccess = () => {
                const result = request.result;
                resolve(result[0] || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateUserConfig(config: Partial<UserConfig>): Promise<UserConfig> {
        return new Promise((resolve, reject) => {
            if (!this.db) throw new Error('Database not initialized');

            const transaction = this.db.transaction(['userConfig'], 'readwrite');
            const store = transaction.objectStore('userConfig');
            const request = store.getAll();

            request.onsuccess = () => {
                const existingConfig = request.result[0] || {};
                const updatedConfig = { ...existingConfig, ...config };

                const putRequest = store.put(updatedConfig);
                putRequest.onsuccess = () => resolve(updatedConfig);
                putRequest.onerror = () => reject(putRequest.error);
            };
            this.setConfigVersion(this.configVersion + 1);
            request.onerror = () => reject(request.error);
        });
    }

    async resetUserConfig(): Promise<UserConfig> {
        if (!this.db) throw new Error('Database not initialized');

        const defaultConfig = {
            user_name: "default_User_Name",
            user_avatar: "https://github.com/shadcn.png",
            user_state: "default_User_State",
            createdAt: new Date().toISOString()
        };
        return this.updateUserConfig(defaultConfig);
    }

    // database operation
    static async deleteDatabase(dbName: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(dbName);

            request.onsuccess = () => {
                console.log(`数据库 ${dbName} 已删除`);
                resolve(true);
            };

            request.onerror = () => {
                console.error(`删除数据库 ${dbName} 失败`);
                reject(request.error);
            };
        });
    }
}

export default IndexedDBService;