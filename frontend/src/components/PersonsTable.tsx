// src/components/PersonsTable.tsx
'use client'
import React, { useMemo, useState } from "react";
import {
    Person,
    PersonControllerApi,
    PersonEyeColorEnum,
    PersonHairColorEnum,
    PersonNationalityEnum
} from "../api";
import EditPersonDialog from "./EditPersonDialog";
import {formatAnyDate} from "@/src/lib/dateUtils";
import {TableCell} from "@/components/ui/table";
import { extractApiErrorMessage } from "@/src/lib/apiError";

type SortDir = 'asc' | 'desc' | null;

export default function PersonsTable({
                                         data,
                                         loading,
                                         onRowClick,
                                         onUpdated,
                                     }: {
    data: Person[],
    loading?: boolean,
    onRowClick?: (p: Person) => void,
    onUpdated?: () => void,
}) {
    const api = useMemo(() => new PersonControllerApi(), []);
    const [filters, setFilters] = useState<Record<string, string>>({
        name: "",
        eyeColor: "",
        hairColor: "",
        locationName: "",
        nationality: "",
    });

    const [sortBy, setSortBy] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [editing, setEditing] = useState<Person | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eyeOptions = Object.values(PersonEyeColorEnum ?? {}) as string[];
    const hairOptions = Object.values(PersonHairColorEnum ?? {}) as string[];
    const nationalityOptions = Object.values(PersonNationalityEnum ?? {}) as string[];

    // Apply filters (exact match on trimmed strings) and then sort
    const visible = useMemo(() => {
        let list = (data || []).slice();

        const matchExactly = (value: string | undefined | null, filter: string) =>
            value != null && value.toString().trim().toLowerCase() === filter.trim().toLowerCase();

        // Filtering: enums exact, strings exact (case-insensitive)
        list = list.filter(p => {
            if (filters.name && !matchExactly(p.name, filters.name)) return false;
            if (filters.eyeColor && (p.eyeColor ?? "") !== filters.eyeColor) return false;
            if (filters.hairColor && (p.hairColor ?? "") !== filters.hairColor) return false;
            if (filters.nationality && (p.nationality ?? "") !== filters.nationality) return false;
            if (filters.locationName && !matchExactly(p.location?.name ?? "", filters.locationName)) return false;
            return true;
        });

        // Sorting
        if (sortBy) {
            list.sort((a, b) => {
                let av: any = null;
                let bv: any = null;

                switch (sortBy) {
                    case "id": av = a.id; bv = b.id; break;
                    case "name": av = a.name; bv = b.name; break;
                    case "creationDate": av = a.creationDate; bv = b.creationDate; break;
                    case "height": av = a.height; bv = b.height; break;
                    case "eyeColor": av = a.eyeColor; bv = b.eyeColor; break;
                    case "hairColor": av = a.hairColor; bv = b.hairColor; break;
                    case "nationality": av = a.nationality; bv = b.nationality; break;
                    case "coordX": av = a.coordinates?.x; bv = b.coordinates?.x; break;
                    case "coordY": av = a.coordinates?.y; bv = b.coordinates?.y; break;
                    case "locationName": av = a.location?.name; bv = b.location?.name; break;
                    default: av = (a as any)[sortBy]; bv = (b as any)[sortBy];
                }

                // Normalize undefined/null
                if (av === undefined || av === null) av = "";
                if (bv === undefined || bv === null) bv = "";

                // Dates -> compare by Date
                if (sortBy === "creationDate") {
                    const da = new Date(av);
                    const db = new Date(bv);
                    if (isNaN(da.getTime()) || isNaN(db.getTime())) {
                        // fallback to string compare
                        av = av.toString(); bv = bv.toString();
                    } else {
                        return sortDir === 'asc' ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
                    }
                }

                // Numeric compare if both are numbers
                if (typeof av === 'number' && typeof bv === 'number') {
                    return sortDir === 'asc' ? av - bv : bv - av;
                }

                // String compare
                const sa = av.toString();
                const sb = bv.toString();
                if (sa < sb) return sortDir === 'asc' ? -1 : 1;
                if (sa > sb) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return list;
    }, [data, filters, sortBy, sortDir]);

    function toggleSort(column: string) {
        if (sortBy !== column) {
            setSortBy(column);
            setSortDir('asc');
            return;
        }
        // same column -> cycle asc -> desc -> none
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') { setSortBy(null); setSortDir(null); }
        else setSortDir('asc');
    }

    async function handleDelete(p: Person) {
        if (!confirm(`Удалить персонажа ${p.name} (id=${p.id})?`)) return;
        setDeletingId(p.id as any);
        setError(null);
        try {
            await api._delete({ id: p.id as any });
            onUpdated && onUpdated();
        } catch (e: any) {
            console.error(e);
            setError(await extractApiErrorMessage(e, "Невозможно удалить персонажа"));
        } finally {
            setDeletingId(null);
        }
    }

    function renderSortIndicator(column: string) {
        if (sortBy !== column) return null;
        if (sortDir === 'asc') return ' ▲';
        if (sortDir === 'desc') return ' ▼';
        return null;
    }

    return (
        <div className="persons-table">
            <div className="mb-2 p-2 border rounded">
                <strong>Фильтры (точное совпадение):</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <div>
                        <div style={{ fontSize: 12 }}>name</div>
                        <input
                            className="border rounded px-2 py-1 bg-white focus-visible:ring-1 focus-visible:ring-primary/50"
                            value={filters.name}
                            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                            placeholder="Введите точное имя"
                        />
                    </div>
                    <div>
                        <div style={{ fontSize: 12 }}>eyeColor</div>
                        <select
                            value={filters.eyeColor}
                            onChange={e => setFilters(f => ({ ...f, eyeColor: e.target.value }))}
                            className="border rounded px-2 py-1 bg-white"
                        >
                            <option value="">—</option>
                            {eyeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={{ fontSize: 12 }}>hairColor</div>
                        <select
                            value={filters.hairColor}
                            onChange={e => setFilters(f => ({ ...f, hairColor: e.target.value }))}
                            className="border rounded px-2 py-1 bg-white"
                        >
                            <option value="">—</option>
                            {hairOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={{ fontSize: 12 }}>nationality</div>
                        <select
                            value={filters.nationality}
                            onChange={e => setFilters(f => ({ ...f, nationality: e.target.value }))}
                            className="border rounded px-2 py-1 bg-white"
                        >
                            <option value="">—</option>
                            {nationalityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={{ fontSize: 12 }}>location.name</div>
                        <input
                            className="border rounded px-2 py-1 bg-white focus-visible:ring-1 focus-visible:ring-primary/50"
                            value={filters.locationName}
                            onChange={e => setFilters(f => ({ ...f, locationName: e.target.value }))}
                            placeholder="введите точное название"
                        />
                    </div>

                    <div style={{ alignSelf: 'end' }}>
                        <button
                            className="border rounded px-3 py-1 bg-white hover:bg-gray-100 transition-colors"
                            onClick={() => setFilters({ name: "", eyeColor: "", hairColor: "", locationName: "", nationality: "" })}
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

            <div style={{ overflowX: 'auto' }}>
                <table className="min-w-full table-auto border-collapse" style={{ width: '100%' }}>
                    <thead>
                    <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("id")}>ID{renderSortIndicator("id")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("name")}>Name{renderSortIndicator("name")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("creationDate")}>Creation date{renderSortIndicator("creationDate")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("height")}>Height{renderSortIndicator("height")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("eyeColor")}>Eye color{renderSortIndicator("eyeColor")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("hairColor")}>Hair color{renderSortIndicator("hairColor")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("nationality")}>Nationality{renderSortIndicator("nationality")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("coordX")}>Coord x{renderSortIndicator("coordX")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("coordY")}>Coord y{renderSortIndicator("coordY")}</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort("locationName")}>Location name{renderSortIndicator("locationName")}</th>
                        <th>Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        <tr><td colSpan={11} style={{ padding: 20, textAlign: 'center' }}>Загрузка...</td></tr>
                    ) : visible.length === 0 ? (
                        <tr><td colSpan={11} style={{ padding: 20, textAlign: 'center' }}>Нет данных</td></tr>
                    ) : visible.map(p => (
                        <tr
                            key={p.id as any}
                            className={`border-t border-gray-100 transition-colors ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                            onClick={() => onRowClick && onRowClick(p)}
                        >
                            <td style={{ padding: 8 }}>{p.id}</td>
                            <td style={{ padding: 8 }}>{p.name}</td>
                            {/*<td style={{ padding: 8 }}>{formatAnyDate(p.creationDate)}</td>*/}
                            <TableCell>{formatAnyDate(p.creationDate)}</TableCell>
                            {/*<td style={{ padding: 8 }}>{p.creationDate?.toString()}</td>*/}
                            <td style={{ padding: 8 }}>{p.height}</td>
                            <td style={{ padding: 8 }}>{p.eyeColor}</td>
                            <td style={{ padding: 8 }}>{p.hairColor ?? '—'}</td>
                            <td style={{ padding: 8 }}>{p.nationality ?? '—'}</td>
                            <td style={{ padding: 8 }}>{p.coordinates?.x}</td>
                            <td style={{ padding: 8 }}>{p.coordinates?.y}</td>
                            <td style={{ padding: 8 }}>{p.location?.name}</td>
                            <td style={{ padding: 8, whiteSpace: 'nowrap' }}>
                                <button
                                    type="button"
                                    className="border rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onRowClick && onRowClick(p); }}
                                >
                                    Просмотр
                                </button>
                                <button
                                    type="button"
                                    className="border rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors ml-2"
                                    onClick={(e) => { e.stopPropagation(); setEditing(p); }}
                                >
                                    Редактировать
                                </button>
                                <button
                                    type="button"
                                    className="border rounded px-2 py-1 text-sm ml-2 transition-colors bg-destructive/90 text-white hover:bg-destructive disabled:opacity-70"
                                    disabled={deletingId === p.id}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                                >
                                    {deletingId === p.id ? "Удаление..." : "Удалить"}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Edit dialog */}
            {editing && (
                <EditPersonDialog
                    isOpen={!!editing}
                    person={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onUpdated && onUpdated(); }}
                />
            )}
        </div>
    );
}
