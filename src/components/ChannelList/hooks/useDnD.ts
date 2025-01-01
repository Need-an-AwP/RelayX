import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    rectIntersection,
    pointerWithin,
    getFirstCollision,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    CollisionDetection,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { Channel } from '@/types/internals/channelsStoreTypes';

interface DragUser {
    id: string;
    name: string;
    // 添加其他用户相关的属性
}

interface DragData {
    user: DragUser;
    fromChannelId: number;
}

interface UseDnDProps {
    onUserMove?: (fromChannelId: number, toChannelId: string, user: DragUser) => void;
}

export const useDnD = ({ onUserMove }: UseDnDProps = {}) => {

    const collisionDetectionStrategy: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);
        if (!pointerCollisions.length) return [];

        // 返回第一个碰撞的目标
        const firstCollision = pointerCollisions[0];
        return [firstCollision];
    };

    const [activeUser, setActiveUser] = useState<DragUser | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveUser(active.data.current as DragUser);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over?.id as string || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeUser = (active.data.current as DragData).user;
        const fromChannelId = (active.data.current as DragData).fromChannelId;
        const toChannelId = over.id;

        if (fromChannelId === toChannelId) return;

        // setUsers(prev => {
        //     const newUsers = { ...prev };
        //     // 从原频道移除用户
        //     newUsers[fromChannelId] = prev[fromChannelId].filter(u => u.id !== activeUser.id);
        //     // 添加用户到新频道
        //     newUsers[toChannelId] = [...(prev[toChannelId] || []), activeUser];
        //     return newUsers;
        // });
        onUserMove?.(fromChannelId, toChannelId as string, activeUser);

        setActiveId(null);
        setOverId(null);
        setActiveUser(null);
    };

    return {
        sensors,
        collisionDetectionStrategy,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        activeUser,
        activeId,
        overId,
        modifiers: [restrictToWindowEdges],
    };
};