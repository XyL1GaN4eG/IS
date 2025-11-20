'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Location, LocationControllerApi, Pageable, Person } from "../api";
import { Button } from "@/components/ui/button";
import CreateLocationForm from "@/src/components/CreateLocationForm";
import { API_BASE } from "@/src/lib/apiBase";
import { extractApiErrorMessage } from "@/src/lib/apiError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

type PersonsCache = Record<number, Person[]>;
type ToastState = { type: "success" | "error"; message: string } | null;

export default function LocationsPage() {
    const api = useMemo(() => new LocationControllerApi(), []);
    const [locations, setLocations] = useState<Location[]>([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [personsCache, setPersonsCache] = useState<PersonsCache>({});
    const [personsError, setPersonsError] = useState<string | null>(null);
    const [personsLoading, setPersonsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
    const [toast, setToast] = useState<ToastState>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((payload: ToastState) => {
        if (!payload) return;
        setToast(payload);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

    const loadPage = useCallback(async (p: number, s: number) => {
        setLoading(true);
        setError(null);
        try {
            const pageable: Pageable = { page: p, size: s, sort: [] as any };
            const resp = await api.list1({ pageable });
            const respTotal = resp.totalPages ?? 0;
            if (respTotal > 0 && p >= respTotal) {
                const last = respTotal - 1;
                setPage(last);
                const resp2 = await api.list1({ pageable: { page: last, size: s, sort: [] as any } });
                setLocations(resp2.content ?? []);
                setTotalPages(resp2.totalPages ?? 0);
            } else {
                setLocations(resp.content ?? []);
                setTotalPages(resp.totalPages ?? 0);
            }
        } catch (err: any) {
            setError(err?.message || "Не удалось загрузить локации");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => { loadPage(page, size); }, [page, size, loadPage]);

    const ensurePersonsFor = useCallback(async (loc: Location) => {
        if (!loc.id) return;
        if (personsCache[loc.id]) return;
        setPersonsLoading(true);
        setPersonsError(null);
        try {
            const res = await fetch(`${API_BASE}/location/${loc.id}/persons`, { credentials: "include" });
            if (!res.ok) throw new Error(await res.text());
            const persons: Person[] = await res.json();
            setPersonsCache(prev => ({ ...prev, [loc.id!]: persons }));
        } catch (err: any) {
            setPersonsError(err?.message || "Не удалось получить список персонажей");
        } finally {
            setPersonsLoading(false);
        }
    }, [personsCache]);

    const onSelect = useCallback((loc: Location) => {
        setSelectedLocation(loc);
        setPersonsError(null);
        if (loc.id) {
            ensurePersonsFor(loc);
        }
    }, [ensurePersonsFor]);

    const selectedPersons = selectedLocation?.id ? personsCache[selectedLocation.id] : undefined;

    const handleCreated = useCallback((location: Location) => {
        setPage(0);
        loadPage(0, size);
        showToast({ type: "success", message: `Локация "${location.name}" создана` });
    }, [loadPage, size, showToast]);

    const requestDelete = useCallback((loc: Location) => {
        setDeleteTarget(loc);
        setDeleteDialogOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        const loc = deleteTarget;
        if (!loc?.id) return;
        setDeletingId(loc.id);
        setDeleteDialogOpen(false);
        try {
            await api.delete1({ id: loc.id as any });
            setPersonsCache(prev => {
                const clone = { ...prev };
                delete clone[loc.id!];
                return clone;
            });
            if (selectedLocation?.id === loc.id) {
                setSelectedLocation(null);
            }
            showToast({ type: "success", message: `Локация #${loc.id} удалена` });
            loadPage(page, size);
        } catch (err: any) {
            let message = await extractApiErrorMessage(err, "Не удалось удалить локацию");
            if (/Невозможно удалить/i.test(message) || /bad request/i.test(message)) {
                message = "Нельзя удалить локацию, пока с ней связаны персонажи.";
            }
            showToast({ type: "error", message });
        } finally {
            setDeletingId(null);
            setDeleteTarget(null);
        }
    }, [api, deleteTarget, selectedLocation, loadPage, page, size, totalPages, showToast]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold">Локации</h1>
                    <p className="text-muted-foreground text-sm">Создавайте локации и смотрите, какие персонажи к ним привязаны.</p>
                </div>
                <Button onClick={() => loadPage(page, size)} disabled={loading}>
                    {loading ? "Обновление..." : "Обновить"}
                </Button>
            </div>

            {error && (
                <div className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                    {error}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
                <Card className="h-full">
                    <CardHeader className="border-b pb-4">
                        <CardTitle>Список локаций</CardTitle>
                        <CardDescription>Выберите локацию, чтобы посмотреть связанных персонажей.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">ID</TableHead>
                                    <TableHead className="w-12">x</TableHead>
                                    <TableHead className="w-12">y</TableHead>
                                    <TableHead className="w-12">z</TableHead>
                                    <TableHead className="w-[30%]">Название</TableHead>
                                    <TableHead className="text-right w-[180px]">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6">Загрузка...</TableCell></TableRow>
                            ) : locations.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6">Нет локаций</TableCell></TableRow>
                            ) : locations.map(loc => {
                                const isSelected = selectedLocation?.id === loc.id;
                                return (
                                    <TableRow key={loc.id} data-state={isSelected ? "selected" : undefined}>
                                        <TableCell>{loc.id}</TableCell>
                                        <TableCell>{loc.x}</TableCell>
                                        <TableCell>{loc.y}</TableCell>
                                        <TableCell>{loc.z}</TableCell>
                                        <TableCell className="max-w-[220px] truncate">{loc.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant={isSelected ? "default" : "outline"} onClick={() => onSelect(loc)}>
                                                    {isSelected ? "Выбрана" : "Просмотр"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={deletingId === loc.id}
                                                    onClick={() => requestDelete(loc)}
                                                >
                                                    {deletingId === loc.id ? "Удаление..." : "Удалить"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Button disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                                    Назад
                                </Button>
                                <span className="text-sm text-muted-foreground">Страница {totalPages === 0 ? 0 : page + 1} из {Math.max(1, totalPages)}</span>
                                <Button disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                                    Вперед
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <label className="text-muted-foreground">Размер</label>
                                <select
                                    value={size}
                                    onChange={e => { const s = parseInt(e.target.value, 10); setSize(s); setPage(0); }}
                                    className="border rounded px-2 py-1"
                                >
                                    {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Создать локацию</CardTitle>
                            <CardDescription>При создании новые локации сразу появятся в списке.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <CreateLocationForm onCreated={handleCreated} />
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle>Связанные персонажи</CardTitle>
                            <CardDescription>Посмотреть, кто использует выбранную локацию.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-4">
                            {selectedLocation ? (
                                <div className="space-y-4">
                                    <div className="rounded border bg-muted/30 px-4 py-3 text-sm leading-6">
                                        <div><b>ID:</b> {selectedLocation.id}</div>
                                        <div><b>Координаты:</b> x={selectedLocation.x}, y={selectedLocation.y}, z={selectedLocation.z}</div>
                                        <div><b>Название:</b> {selectedLocation.name}</div>
                                    </div>

                                    {personsError && <div className="text-red-600 text-sm">{personsError}</div>}

                                    {personsLoading && !selectedPersons && (
                                        <div>Загрузка персонажей...</div>
                                    )}

                                    {selectedPersons ? (
                                        selectedPersons.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">Нет персонажей, связанных с этой локацией.</div>
                                        ) : (
                                            <ul className="space-y-2 text-sm">
                                                {selectedPersons.map(p => (
                                                    <li key={p.id as any} className="rounded border px-3 py-2">
                                                        <div className="font-semibold">#{p.id}: {p.name}</div>
                                                        <div>Рост: {p.height}, Цвет глаз: {p.eyeColor}</div>
                                                        <div>Национальность: {p.nationality ?? "—"}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )
                                    ) : (
                                        !personsLoading && <div className="text-sm text-muted-foreground">Выберите локацию слева, чтобы увидеть связанных персонажей.</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">Выберите локацию слева, чтобы посмотреть связанных персонажей.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить локацию?</DialogTitle>
                        <DialogDescription>
                            {deleteTarget ? `Локация #${deleteTarget.id} (${deleteTarget.name}) будет удалена. Действие невозможно отменить.` : "Удалить выбранную локацию?"}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deletingId !== null}>
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deletingId !== null}>
                            {deletingId !== null ? "Удаление..." : "Удалить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {toast && (
                <div
                    className={`fixed left-6 bottom-6 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${
                        toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}
