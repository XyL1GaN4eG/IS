'use client'
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/src/lib/apiBase";
import { USER_HEADERS, UserScope } from "@/src/lib/userHeaders";

type NotifyPayload = { type: 'success' | 'error'; message: string };

type ImportJob = {
    id: number;
    username: string;
    fileName: string;
    fileAvailable?: boolean;
    status: "IN_PROGRESS" | "SUCCESS" | "FAILED";
    createdAt: string;
    finishedAt?: string;
    addedCount?: number;
    errorMessage?: string;
};

type ImportResource = "persons" | "location";

export default function ImportPanel({ resource = "persons", onImported, onNotify }: {
    resource?: ImportResource;
    onImported?: () => void;
    onNotify?: (payload: NotifyPayload) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [history, setHistory] = useState<ImportJob[]>([]);
    const [scope, setScope] = useState<UserScope>("own");
    const [loadingHistory, setLoadingHistory] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const scopeRef = useRef(scope);

    const notify = useCallback((payload: NotifyPayload) => onNotify && onNotify(payload), [onNotify]);

    const loadHistory = useCallback(async (currentScope: UserScope) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API_BASE}/${resource}/imports?scope=${currentScope}`, {
                credentials: "include",
                headers: USER_HEADERS,
            });
            if (!res.ok) throw new Error(await res.text());
            const list: ImportJob[] = await res.json();
            setHistory(list);
        } catch (err: any) {
            notify({ type: "error", message: err?.message || "Не удалось загрузить историю импорта" });
        } finally {
            setLoadingHistory(false);
        }
    }, [notify, resource]);

    useEffect(() => { loadHistory(scope); }, [scope, loadHistory]);

    useEffect(() => {
        scopeRef.current = scope;
    }, [scope]);

    useEffect(() => {
        const es = new EventSource(`${API_BASE}/imports/stream`);
        const handler = () => loadHistory(scopeRef.current);
        es.addEventListener(`import_${resource}`, handler);
        es.onerror = () => {
            setTimeout(() => {
                es.close();
                loadHistory(scopeRef.current);
            }, 2000);
        };
        return () => {
            es.removeEventListener(`import_${resource}`, handler);
            es.close();
        };
    }, [resource, loadHistory]);

    async function handleUpload() {
        if (!file) {
            notify({ type: "error", message: "Выберите YAML-файл для импорта" });
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${API_BASE}/${resource}/import`, {
                method: "POST",
                body: form,
                credentials: "include",
                headers: USER_HEADERS,
            });
            if (!res.ok) throw new Error(await res.text());
            notify({ type: "success", message: "Импорт запущен" });
            setFile(null);
            onImported && onImported();
            loadHistory(scope);
        } catch (err: any) {
            notify({ type: "error", message: err?.message || "Ошибка запуска импорта" });
        } finally {
            setUploading(false);
        }
    }

    async function handleDownload(job: ImportJob) {
        try {
            const res = await fetch(`${API_BASE}/imports/${job.id}/file`, {
                credentials: "include",
                headers: USER_HEADERS,
            });
            if (!res.ok) throw new Error(await res.text());

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = job.fileName || `import-${job.id}.yaml`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            notify({ type: "error", message: err?.message || "Не удалось скачать файл импорта" });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Импорт из YAML</CardTitle>
                <CardDescription>
                    Загрузите файл с массивом {resource === "persons" ? "persons" : "locations"} и просматривайте историю операций.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".yaml,.yml,text/yaml"
                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" type="button" className="hover:bg-muted/80 transition-colors" onClick={() => fileInputRef.current?.click()}>
                            {file ? "Выбран файл" : "Выбрать YAML-файл"}
                        </Button>
                        <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {file ? file.name : "Файл не выбран"}
                        </span>
                    </div>
                    <Button className="transition-colors hover:opacity-90" onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Загрузка..." : "Импортировать"}
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">История импорта</div>
                    <select
                        value={scope}
                        onChange={e => setScope(e.target.value as UserScope)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="own">Мои операции</option>
                        <option value="all">Все операции</option>
                    </select>
                </div>

                <div className="space-y-3 max-h-72 overflow-auto border rounded p-3 bg-muted/20">
                    {loadingHistory ? (
                        <div>Загрузка истории...</div>
                    ) : history.length === 0 ? (
                        <div className="text-sm text-muted-foreground">История пуста</div>
                    ) : history.map(job => (
                        <div key={job.id} className="rounded border bg-white px-3 py-2 text-sm">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold">#{job.id} — {job.status}</div>
                                <div className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</div>
                            </div>
                            <div>Файл: {job.fileName}</div>
                            <div>Пользователь: {job.username}</div>
                            {job.fileAvailable && (
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="mt-2"
                                    onClick={() => handleDownload(job)}
                                >
                                    Скачать файл
                                </Button>
                            )}
                            {job.addedCount != null && <div>Добавлено объектов: {job.addedCount}</div>}
                            {job.errorMessage && (
                                <div className="text-red-600">Ошибка: {job.errorMessage}</div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
