'use client'
import React, { useEffect, useState, useCallback, useRef } from "react";
import PersonsTable from "@/src/components/PersonsTable";
import usePersonsRealtime from "@/src/hooks/usePersonsRealtime";
import { Button } from "@/components/ui/button";
import SpecialOperationsPanel from "./SpecialOperationsPanel";
import CreatePersonForm from "./CreatePersonForm";
import ImportPanel from "./ImportPanel";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import PersonDetail from "@/src/components/PersonDetails";
import { Person } from "../api";
import { API_BASE } from "@/src/lib/apiBase";
import { USER_HEADERS } from "@/src/lib/userHeaders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageResp<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number; // текущая страница
    size: number;
};

type ToastState = { type: 'success' | 'error'; message: string } | null;

export default function PersonsPage() {
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [persons, setPersons] = useState<Person[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [showCreate, setShowCreate] = useState(false);
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
        try {
            const u = new URL(`${API_BASE}/persons`);
            u.searchParams.set("page", String(p));
            u.searchParams.set("size", String(s));
            // при необходимости: u.searchParams.append("sort", "name,asc")

            const res = await fetch(u.toString(), { credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());

            const json: PageResp<Person> = await res.json();

            // Если запрошенная страница > последней (например, после удалений) — прыгаем на последнюю
            if (json.totalPages > 0 && p >= json.totalPages) {
                setPage(json.totalPages - 1);
                // перезагрузим корректную страницу
                const u2 = new URL(`${API_BASE}/persons`);
                u2.searchParams.set("page", String(json.totalPages - 1));
                u2.searchParams.set("size", String(s));
                const res2 = await fetch(u2.toString(), { credentials: "include", headers: USER_HEADERS });
                const j2: PageResp<Person> = await res2.json();
                setPersons(j2.content ?? []);
                setTotalPages(j2.totalPages ?? 0);
            } else {
                setPersons(json.content ?? []);
                setTotalPages(json.totalPages ?? 0);
            }
        } catch (e) {
            console.error("Failed to load persons:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Реакция на SSE/поллинг
    usePersonsRealtime({ onChange: () => loadPage(page, size), pollIntervalMs: 5000 });

    useEffect(() => { loadPage(page, size); }, [page, size, loadPage]);

    function onRowClick(p: Person) { setSelectedPerson(p); }
    function onCreated(person?: Person) {
        setShowCreate(false);
        loadPage(0, size);
        if (person) showToast({ type: 'success', message: `Персонаж "${person.name}" создан` });
    }

    const handleOperationFeedback = useCallback((payload: { type: 'success' | 'error'; message: string }) => {
        showToast(payload);
    }, [showToast]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold">Персонажи</h1>
                    <p className="text-muted-foreground text-sm">Работайте со списком людей, фильтруйте и запускайте специальные операции.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowCreate(true)}>Создать персонажа</Button>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
                <Card>
                    <CardHeader className="border-b pb-4">
                        <CardTitle>Список персонажей</CardTitle>
                        <CardDescription>Кликните по строке, чтобы открыть подробности.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <PersonsTable
                            data={persons}
                            loading={loading}
                            onRowClick={onRowClick}
                            onUpdated={() => loadPage(page, size)}
                        />

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
                                    onChange={e => {
                                        const s = parseInt(e.target.value, 10);
                                        setSize(s);
                                        setPage(0);
                                    }}
                                    className="border rounded px-2 py-1"
                                >
                                    {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <ImportPanel resource="persons" onImported={() => loadPage(0, size)} onNotify={handleOperationFeedback} />
                    <SpecialOperationsPanel
                        onDone={() => loadPage(0, size)}
                        onNotify={handleOperationFeedback}
                    />
                </div>
            </div>

            {/* Диалог создания */}
            <Dialog open={showCreate} onOpenChange={open => setShowCreate(open)}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader><DialogTitle>Создать персонажа</DialogTitle></DialogHeader>
                    <div className="p-4">
                        <CreatePersonForm onCreated={onCreated} />
                    </div>
                    <DialogClose asChild>
                        <button className="absolute top-2 right-2 text-2xl leading-none">&times;</button>
                    </DialogClose>
                </DialogContent>
            </Dialog>




{/* Просмотр/детали персонажа */}
            <Dialog open={!!selectedPerson} onOpenChange={open => { if (!open) setSelectedPerson(null); }}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Информация о персонаже</DialogTitle>
                    </DialogHeader>
                    {selectedPerson && (
                        <div className="p-4">
                            <PersonDetail
                                person={selectedPerson}
                                onClose={() => setSelectedPerson(null)}
                                onUpdated={() => { loadPage(page, size); setSelectedPerson(null); }}
                            />
                        </div>
                    )}
                    <DialogClose asChild>
                        <button className="absolute top-2 right-2 text-2xl leading-none">&times;</button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            {toast && (
                <div
                    className={`fixed left-6 bottom-6 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );


}
