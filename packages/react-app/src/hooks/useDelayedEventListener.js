import { useState, useEffect } from 'react';
import { useEventListener } from 'eth-hooks/events';

export function useDelayedEventListener(contracts, contractName, eventName, provider, startBlock, delay) {
    const [events, setEvents] = useState([]);
    const currentEvents = useEventListener(contracts, contractName, eventName, provider, startBlock);

    useEffect(() => {
        const timer = setTimeout(() => {
            setEvents(currentEvents);
        }, delay);

        return () => clearTimeout(timer);
    }, [currentEvents, delay]);

    return events;
}