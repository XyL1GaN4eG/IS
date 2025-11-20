// src/components/CoordinatesPicker.tsx
'use client'
import React from 'react';
import { Coordinates, CoordinatesControllerApi, Pageable } from '../api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import usePageableList from '@/src/hooks/usePageableList';
import { Label } from '@/components/ui/label';

const api = new CoordinatesControllerApi();

function labelFor(c: Coordinates) {
    return `#${c.id}  (x=${c.x}, y=${c.y})`;
}

export default function CoordinatesPicker({
                                              valueId,
                                              onChangeId,
                                          }: {
    valueId: number | null;
    onChangeId: (id: number | null) => void;
}) {
    const fetchPage = React.useCallback(async (page: number, size: number) => {
        const pageable: Pageable = { page, size, sort: [] as any };
        const res: any =
            (api as any).list2 ? await (api as any).list2({ pageable }) :
                (api as any).list_2 ? await (api as any).list_2({ pageable }) :
                    await (api as any).list({ pageable });
        return res as any;
    }, []);

    const { items, loading } = usePageableList<Coordinates>(fetchPage, 30);

    return (
        <div className="space-y-1">
            <Label>— выбрать —</Label>
            <Select
                value={valueId ? String(valueId) : ''}
                onValueChange={(v) => onChangeId(v ? Number(v) : null)}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={loading ? 'Загрузка...' : '— выбрать —'} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                            {labelFor(c)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
