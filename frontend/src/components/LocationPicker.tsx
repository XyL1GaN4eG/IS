// src/components/LocationPicker.tsx
'use client'
import React from 'react';
import { Location, LocationControllerApi, Pageable } from '../api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import usePageableList from '@/src/hooks/usePageableList';
import { Label } from '@/components/ui/label';

const api = new LocationControllerApi();

function labelFor(l: Location) {
    return `#${l.id}  (x=${l.x}, y=${l.y}, z=${l.z}, name=${l.name ?? "—"})`;
}

export default function LocationPicker({
                                           valueId,
                                           onChangeId,
                                       }: {
    valueId: number | null;
    onChangeId: (id: number | null) => void;
}) {
    const fetchPage = React.useCallback(async (page: number, size: number) => {
        const pageable: Pageable = { page, size, sort: [] as any };
        const res: any =
            (api as any).list_1 ? await (api as any).list_1({ pageable }) :
                (api as any).list1 ? await (api as any).list1({ pageable }) :
                    await (api as any).list({ pageable });
        return res as any;
    }, []);

    const { items, loading } = usePageableList<Location>(fetchPage, 30);

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
                    {items.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                            {labelFor(l)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
