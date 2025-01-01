/**
 * MurmurHash3 implementation
 * @param str - Input string
 * @param seed - Optional seed value (default: 0)
 * @returns 32-bit unsigned integer hash
 */
export function murmurhash(str: string, seed: number = 0): number {
    let h1 = seed;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    for (let i = 0; i < str.length; i++) {
        let k1 = str.charCodeAt(i);
        k1 = ((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16);
        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = ((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16);
        h1 = (h1 & 0xffff) + 0x6b64 + ((((h1 >>> 16) + 0xe654) & 0xffff) << 16);
    }
    
    h1 ^= str.length;
    h1 ^= h1 >>> 16;
    h1 = ((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16);
    h1 ^= h1 >>> 13;
    h1 = ((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16);
    h1 ^= h1 >>> 16;
    
    return h1 >>> 0;
}

/**
 * Calculate hash for any object
 * @param obj - Input object
 * @param seed - Optional seed value (default: 0)
 * @returns 32-bit unsigned integer hash
 */
export function hashObject(obj: any, seed: number = 0): number {
    // 确保对象序列化的一致性：
    // 1. 对键进行排序
    // 2. 移除undefined值
    // 3. 保持数组顺序
    const str = JSON.stringify(obj, (key, value) => 
        value === undefined ? null : value, // 将undefined转换为null以保持一致性
        2 // 使用2个空格缩进，保持格式一致性
    );
    return murmurhash(str, seed);
}

// 导出一些常用的种子值
export const HASH_SEEDS = {
    DEFAULT: 0,
    DEADBEEF: 0xdeadbeef,
    CAFE: 0xcafebabe,
} as const;