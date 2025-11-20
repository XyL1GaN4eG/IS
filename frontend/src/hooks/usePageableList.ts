// src/hooks/usePageableList.ts
'use client'
import { useCallback, useEffect, useRef, useState } from 'react';

type PageResp<T> = {
    content: T[];
    totalPages: number;
    number: number;
    size: number;
};

export default function usePageableList<T>(
    fetchPage: (page: number, size: number) => Promise<PageResp<T>>,
    initialSize = 20,
) {
    const [items, setItems] = useState<T[]>([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(initialSize);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (p = 0, s = size) => {
        setLoading(true);
        try {
            const r = await fetchPage(p, s);
            setItems(r.content || []);
            setPage(r.number ?? p);
            setSize(r.size ?? s);
            setTotalPages(r.totalPages ?? 1);
        } finally {
            setLoading(false);
        }
    }, [fetchPage, size]);

    useEffect(() => { load(0, size); }, [load, size]);

    return { items, page, size, totalPages, loading, reload: () => load(page, size) };
}
