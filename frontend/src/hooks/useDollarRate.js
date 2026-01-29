import { useState, useEffect, useRef, useCallback } from 'react';

const useDollarRate = () => {
    const [dollarRate, setDollarRate] = useState(null);
    const [dollarVariation, setDollarVariation] = useState(0);
    const [lastClose, setLastClose] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);

    const USD_BRL_PID = '2103';

    const parseMessage = useCallback((data) => {
        try {
            if (data.startsWith('a[')) {
                const jsonStr = data.slice(2, -1);
                const innerStr = JSON.parse(jsonStr);
                const parsed = JSON.parse(innerStr);

                if (parsed.message) {
                    const regex = new RegExp(`pid-${USD_BRL_PID}::(.+)`);
                    const match = parsed.message.match(regex);
                    if (match) {
                        const priceData = JSON.parse(match[1]);

                        const rate = parseFloat(priceData.last.replace(/,/g, ''));

                        const variation = parseFloat(priceData.pcp?.replace('%', '').replace(',', '.')) || 0;

                        let close = null;
                        if (priceData.last_close) {
                            close = parseFloat(priceData.last_close.replace(/,/g, ''));
                        }

                        return {
                            rate,
                            variation,
                            lastClose: close,
                            time: priceData.time,
                            timestamp: priceData.timestamp
                        };
                    }
                }
            }
            if (data === 'o') {
                return { type: 'open' };
            }
            if (data === 'h') {
                return { type: 'heartbeat' };
            }
            return null;
        } catch (error) {

            return null;
        }
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const sessionId = Math.floor(Math.random() * 1000);
        const serverId = Math.random().toString(36).substring(2, 10);

        const wsUrl = `wss://streaming.forexpros.com/echo/${sessionId}/${serverId}/websocket`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {

            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = event.data;
            const parsed = parseMessage(data);

            if (parsed) {
                if (parsed.type === 'open') {

                    const subscribeMsg = JSON.stringify({
                        "_event": "bulk-subscribe",
                        "tzID": 8,
                        "message": `pid-${USD_BRL_PID}:`
                    });

                    ws.send(`["${subscribeMsg.replace(/"/g, '\\"')}"]`);

                } else if (parsed.type === 'heartbeat') {

                } else if (parsed.rate) {

                    setDollarRate(parsed.rate);
                    setDollarVariation(parsed.variation);
                    if (parsed.lastClose) {
                        setLastClose(parsed.lastClose);
                    }
                    setLastUpdate(new Date());
                }
            }
        };

        ws.onerror = (error) => {

            setIsConnected(false);
        };

        ws.onclose = (event) => {

            setIsConnected(false);
            reconnectTimeoutRef.current = setTimeout(() => {

                connect();
            }, 5000);
        };
    }, [parseMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        dollarRate,
        dollarVariation,
        lastClose,
        isConnected,
        lastUpdate,
        reconnect: connect
    };
};

export default useDollarRate;
