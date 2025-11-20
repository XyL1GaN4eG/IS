'use client'
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE } from "@/src/lib/apiBase";
import { USER_HEADERS } from "@/src/lib/userHeaders";
import { Person } from "../api";

type NotifyPayload = { type: 'success' | 'error'; message: string };

export default function SpecialOperationsPanel({ onDone, onNotify }: { onDone?: () => void; onNotify?: (payload: NotifyPayload) => void }) {
    const [height, setHeight] = useState("");
    const [heightError, setHeightError] = useState<string | null>(null);
    const [eyeColor, setEyeColor] = useState("GREEN");
    const [loading, setLoading] = useState(false);

    const [maxPerson, setMaxPerson] = useState<Person | null>(null);
    const [uniqueHeights, setUniqueHeights] = useState<number[]>([]);
    const [eyeStats, setEyeStats] = useState<{ count?: number; share?: number } | null>(null);

    function notify(payload: NotifyPayload) {
        onNotify && onNotify(payload);
    }

    async function deleteByHeight() {
        const h = parseFloat(height);
        if (!isFinite(h)) {
            setHeightError("Введите число");
            return;
        }
        setHeightError(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/persons/by-height?height=${encodeURIComponent(String(h))}`, { method: "DELETE", credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());
            const deleted = Number(await res.json());
            notify({ type: 'success', message: deleted > 0 ? `Удалено ${deleted} записей` : "Совпадений не найдено" });
            onDone && onDone();
        } catch (err: any) {
            notify({ type: 'error', message: err?.message || "Не удалось выполнить удаление" });
        } finally { setLoading(false); }
    }

    async function getMaxIdPerson() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/persons/max-id`, { credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());
            const p = await res.json();
            setMaxPerson(p);
        } catch (err: any) {
            notify({ type: 'error', message: err?.message || "Не удалось получить запись" });
        } finally { setLoading(false); }
    }

    async function getUniqueHeights() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/persons/unique-heights`, { credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());
            const arr = await res.json();
            setUniqueHeights(arr || []);
        } catch (err: any) {
            notify({ type: 'error', message: err?.message || "Не удалось получить значения" });
        } finally { setLoading(false); }
    }

    async function getCountByEyeColor() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/persons/count-by-eye-color?eyeColor=${encodeURIComponent(eyeColor)}`, { credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());
            const cnt = Number(await res.text());
            setEyeStats(prev => ({ ...prev, count: cnt }));
        } catch (err: any) {
            notify({ type: 'error', message: err?.message || "Не удалось получить количество" });
        } finally { setLoading(false); }
    }

    async function getShareByEyeColor() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/persons/share-by-eye-color?eyeColor=${encodeURIComponent(eyeColor)}`, { credentials: "include", headers: USER_HEADERS });
            if (!res.ok) throw new Error(await res.text());
            const pct = Number(await res.text());
            setEyeStats(prev => ({ ...prev, share: pct }));
        } catch (err: any) {
            notify({ type: 'error', message: err?.message || "Не удалось рассчитать долю" });
        } finally { setLoading(false); }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Удаление по росту</CardTitle>
                    <CardDescription>Удалить всех персонажей с указанным значением height.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <Label>Рост</Label>
                        <Input
                            className="bg-white"
                            value={height}
                            onChange={e => { setHeight(e.target.value); setHeightError(null); }}
                            placeholder="Например, 175"
                        />
                        {heightError && <p className="text-red-600 text-sm mt-1">{heightError}</p>}
                    </div>
                    <Button onClick={deleteByHeight} disabled={loading}>Удалить записи</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Отчёты</CardTitle>
                    <CardDescription>Найдите максимальный ID или статистику по росту и цвету глаз.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={getMaxIdPerson} disabled={loading}>Персонаж с max ID</Button>
                        <Button onClick={getUniqueHeights} disabled={loading} variant="outline">Уникальные height</Button>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col">
                            <Label>Цвет глаз</Label>
                            <select
                                value={eyeColor}
                                onChange={e => { setEyeColor(e.target.value); setEyeStats(null); }}
                                className="border rounded px-3 py-2 bg-white"
                            >
                                <option>GREEN</option>
                                <option>ORANGE</option>
                                <option>WHITE</option>
                                <option>BROWN</option>
                            </select>
                        </div>
                        <Button onClick={getCountByEyeColor} disabled={loading}>Количество</Button>
                        <Button onClick={getShareByEyeColor} variant="secondary" disabled={loading}>Доля (%)</Button>
                    </div>

                    {maxPerson && (
                        <div className="rounded border bg-muted/30 px-4 py-3 text-sm">
                            <div className="font-semibold">#{maxPerson.id}: {maxPerson.name}</div>
                            <div>Рост: {maxPerson.height}, Цвет глаз: {maxPerson.eyeColor}</div>
                            <div>Создан: {maxPerson.creationDate}</div>
                        </div>
                    )}

                    {uniqueHeights.length > 0 && (
                        <div>
                            <div className="text-sm font-semibold mb-2">Уникальные значения height:</div>
                            <div className="flex flex-wrap gap-2">
                                {uniqueHeights.map((h) => (
                                    <span key={h} className="rounded-full border px-3 py-1 text-sm bg-white">{h}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {eyeStats && (
                        <div className="rounded border px-4 py-3 text-sm">
                            {eyeStats.count !== undefined && <div>Количество для {eyeColor}: <b>{eyeStats.count}</b></div>}
                            {eyeStats.share !== undefined && <div>Доля: <b>{eyeStats.share.toFixed(2)}%</b></div>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
