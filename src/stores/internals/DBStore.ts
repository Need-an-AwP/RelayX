import { create } from 'zustand';
import type { DBStore, Network } from '@/types';
import IndexedDBService from '@/services/IndexedDBService';
import { useTailscale } from '@/stores';
import { subscribeWithSelector } from 'zustand/middleware'

export const useDB = create<DBStore>()(
    subscribeWithSelector((set, get) => ({
        // State
        isInitialized: false,
        configVersion: 0,
        selfConfig: null,
        currentDBName: '',
        dbService: null,

        // State setters
        setIsInitialized: (value) => set({ isInitialized: value }),
        setConfigVersion: (version) => set({ configVersion: version }),
        setSelfConfig: (config) => set({ selfConfig: config }),
        setCurrentDBName: (name) => set({ currentDBName: name }),
        setDBService: (service) => set({ dbService: service }),

        // Database operations
        deleteDatabase: async () => {
            const { dbService, currentDBName } = get();
            if (!dbService) return;

            dbService.db?.close();
            await IndexedDBService.deleteDatabase(currentDBName);
            set({ dbService: null, isInitialized: false });
        },

        // User config operations
        getUserConfig: async () => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            return await dbService.getUserConfig();
        },

        updateUserConfig: async (config) => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            const updatedConfig = await dbService.updateUserConfig(config);
            set({ selfConfig: updatedConfig });
            return updatedConfig;
        },

        resetUserConfig: async () => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            const defaultConfig = await dbService.resetUserConfig();
            set({ selfConfig: defaultConfig });
            return defaultConfig;
        },

        // Network operations
        getAllNetworks: async () => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            return await dbService.getAllNetworks();
        },

        updateNetwork: async (network) => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            return await dbService.updateNetwork(network);
        },

        deleteNetwork: async (networkId) => {
            const { dbService } = get();
            if (!dbService) throw new Error('Database not initialized');
            return await dbService.deleteNetwork(networkId);
        },
    }))
);

export const initializeDB = async () => {
    const { status, loginName, selfID } = useTailscale.getState();
    if (!status) return null;

    const { isInitialized } = useDB.getState();
    if (isInitialized) return null;

    const store = useDB.getState();
    const dbName = String(selfID);

    // 如果数据库名称改变，需要重新初始化
    if (dbName !== store.currentDBName) {
        // 关闭现有连接
        if (store.dbService?.db) {
            store.dbService.db.close();
        }

        // 创建新的数据库服务
        const currentNetwork: Network = {
            network_name: loginName,
            network_id: selfID!
        };

        store.setCurrentDBName(dbName);
        const newDBService = new IndexedDBService(
            currentNetwork,
            store.configVersion,
            store.setConfigVersion
        );

        try {
            await newDBService.initDB();
            store.setDBService(newDBService);
            store.setIsInitialized(true);

            const config = await newDBService.getUserConfig();
            store.setSelfConfig(config);
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }
};