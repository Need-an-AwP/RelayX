import { Channel } from "@/types";


const fetchChannels = async (loginName: string): Promise<{ channels: Channel[]; isPreset: boolean }> => {
    try {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('request channels timeout')), 5000); // 5秒超时
        });
        const fetchPromise = fetch(`http://1.12.226.82:3000/channel/${loginName}`);

        const res = await Promise.race([fetchPromise, timeout]) as Response;
        const data = await res.json();
        const channels = data.channels.map((channel: any) => ({
            id: channel.id,
            name: channel.channel_name,
            type: channel.channel_type,
            // ...channel
            // keep all original fields
        }));
        console.log(channels);
        return {
            channels: channels,
            isPreset: false
        };
    } catch (error) {
        console.error(error);
        return {
            channels: presetChannels,
            isPreset: true
        };
    }
}

const presetChannels: Channel[] = [
    { id: 1, name: 'test text', type: 'text' },
    { id: 2, name: 'test voice A', type: 'voice' },
    { id: 3, name: 'test voice B', type: 'voice' },
    { id: 4, name: 'test voice C', type: 'voice' },
    { id: 5, name: 'teeeest text', type: 'text' },
];

export default fetchChannels