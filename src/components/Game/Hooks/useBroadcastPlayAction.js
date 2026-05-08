import {useEffect, useCallback, useRef} from 'react';

/**
 * Hook to broadcast and listen to play card actions across browser tabs
 */
function useBroadcastPlayAction() {
    const CHANNEL_NAME = 'game-play-action';
    const channelRef = useRef(null);

    useEffect(() => {
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);

        return () => {
            channelRef.current?.close();
        };
    }, []);


    const broadcastPlayAction = useCallback((data) => {
        if (channelRef.current) {
            channelRef.current.postMessage({
                type: 'PLAY_CARDS',
                ...data,
                timestamp: Date.now(),
            });
        }
    }, []);


    const onPlayAction = useCallback((callback) => {
        if (!channelRef.current) return;

        const handler = (event) => {
            if (event.data.type === 'PLAY_CARDS') {
                callback(event.data);
            }
        };

        channelRef.current.addEventListener('message', handler);

        return () => {
            channelRef.current?.removeEventListener('message', handler);
        };
    }, []);

    return { broadcastPlayAction, onPlayAction };
}

export default useBroadcastPlayAction;