import { useRTCStore } from '@/stores';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RTCConnectionDisplay: React.FC = () => {
    const connections = useRTCStore((state) => state.connections);
    const connectionArray = Array.from(connections.values());

    if (connectionArray.length === 0) {
        return (
            <Card className="w-full max-w-md mx-auto mt-4">
                <CardHeader>
                    <CardTitle>RTC 连接状态</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>当前没有活动的RTC连接。</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {connectionArray.map((conn) => (
                <Card key={conn.peerID} className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Peer ID: {conn.peerID}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p><strong>状态:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            conn.state === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            conn.state === 'connecting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            conn.state === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            conn.state === 'disconnected' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            conn.state === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' // new, etc.
                        }`}>{conn.state}</span></p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default RTCConnectionDisplay;
