// src/hooks/usePersonsRealtime.ts
'use client'
import { useEffect, useRef } from 'react';
import { API_BASE } from "@/src/lib/apiBase";

export default function usePersonsRealtime({
                                               onChange, pollIntervalMs = 5000,
                                           }: { onChange: () => void; pollIntervalMs?: number }) {

    const esRef = useRef<EventSource | null>(null);
    const pollRef = useRef<number | null>(null);
    const base = API_BASE;

    // ✅ всегда актуальный колбэк (без пересоздания EventSource)
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange }, [onChange]);

    useEffect(() => {
        let stopped = false;

        const startPolling = () => {
            if (!pollRef.current) {
                pollRef.current = window.setInterval(() => {
                    if (!stopped) onChangeRef.current?.();
                }, pollIntervalMs);
            }
        };
        const stopPolling = () => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        };

        const connect = () => {
            try {
                const es = new EventSource(`${base}/persons/stream`, { withCredentials: true });
                esRef.current = es;

                const handler = () => { if (!stopped) onChangeRef.current?.(); };

                es.addEventListener('persons', handler);
                es.addEventListener('keepalive', () => {});
                es.onmessage = handler;

                es.onerror = () => {
                    es.close();
                    startPolling();
                    setTimeout(() => { stopPolling(); if (!stopped) connect(); }, 3000);
                };
            } catch {
                startPolling();
            }
        };

        connect();
        return () => { stopped = true; esRef.current?.close(); stopPolling(); };
    }, [base, pollIntervalMs]);
}
