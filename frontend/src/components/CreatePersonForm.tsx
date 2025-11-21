// src/components/CreatePersonForm.tsx
'use client'
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Person, PersonControllerApi,
    PersonEyeColorEnum, PersonHairColorEnum, PersonNationalityEnum
} from "../api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CoordinatesPicker from "@/src/components/CoordinatesPicker";
import LocationPicker from "@/src/components/LocationPicker";
import { API_BASE } from "@/src/lib/apiBase";
import { USER_HEADERS } from "@/src/lib/userHeaders";

const api = new PersonControllerApi();
const NONE = '__NONE__';
export default function CreatePersonForm({ onCreated }: { onCreated?: (person: Person) => void }) {
    const [name, setName] = useState("");
    // coords: режим выбора существующих
    const [useExistingCoords, setUseExistingCoords] = useState(true);
    const [coordId, setCoordId] = useState<number | null>(null);
    const [coordX, setCoordX] = useState("");
    const [coordY, setCoordY] = useState("");

    // location: режим выбора существующих
    const [useExistingLocation, setUseExistingLocation] = useState(false);
    const [locId, setLocId] = useState<number | null>(null);
    const [locX, setLocX] = useState("");
    const [locY, setLocY] = useState("");
    const [locZ, setLocZ] = useState("");
    const [locName, setLocName] = useState("");

    const [eyeColor, setEyeColor] = useState<PersonEyeColorEnum | "">("");
    const [hairColor, setHairColor] = useState<PersonHairColorEnum | null>(null);
    // const [hairColor, setHairColor] = useState<PersonHairColorEnum | "">("");
    const [height, setHeight] = useState("");
    const [nationality, setNationality] = useState<PersonNationalityEnum | null>(null);
    // const [nationality, setNationality] = useState<PersonNationalityEnum | "">("");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const eyeOptions = Object.values(PersonEyeColorEnum);
    const hairOptions = Object.values(PersonHairColorEnum);
    const nationOptions = Object.values(PersonNationalityEnum);

    const touchField = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

    const setFieldError = (field: string, message?: string) => {
        setErrors(prev => {
            const next = { ...prev };
            if (message) next[field] = message; else delete next[field];
            return next;
        });
    };

    const validateField = useCallback((field: string, value?: string) => {
        switch (field) {
            case 'name':
                if (!value || value.trim().length < 2) setFieldError(field, "Имя должно быть длиной от 2 символов");
                else setFieldError(field);
                break;
            case 'height': {
                const h = parseFloat(value ?? height);
                if (!isFinite(h)) setFieldError(field, "Укажите число");
                else if (h <= 0) setFieldError(field, "Рост должен быть больше 0");
                else setFieldError(field);
                break;
            }
            case 'coordX': {
                const x = parseInt(value ?? coordX, 10);
                if (!Number.isInteger(x)) setFieldError(field, "Введите целое число");
                else if (x < -917) setFieldError(field, "X должен быть ≥ -917");
                else setFieldError(field);
                break;
            }
            case 'coordY': {
                const y = parseFloat(value ?? coordY);
                if (!isFinite(y)) setFieldError(field, "Введите число");
                else setFieldError(field);
                break;
            }
            case 'locX': {
                const lx = parseInt(value ?? locX, 10);
                if (!Number.isInteger(lx)) setFieldError(field, "Введите целое число");
                else setFieldError(field);
                break;
            }
            case 'locY': {
                const ly = parseFloat(value ?? locY);
                if (!isFinite(ly)) setFieldError(field, "Введите число");
                else setFieldError(field);
                break;
            }
            case 'locZ': {
                const lz = parseInt(value ?? locZ, 10);
                if (!Number.isInteger(lz)) setFieldError(field, "Введите целое число");
                else setFieldError(field);
                break;
            }
            case 'locName':
                if (!value || value.trim().length === 0) setFieldError(field, "Название обязательно");
                else setFieldError(field);
                break;
            default:
                break;
        }
    }, [coordX, coordY, locX, locY, locZ, locName, height]);

    function validate(): boolean {
        const fieldsToCheck = ['name', 'height'];
        if (!useExistingCoords) fieldsToCheck.push('coordX', 'coordY');
        if (!useExistingLocation) fieldsToCheck.push('locX', 'locY', 'locZ', 'locName');
        fieldsToCheck.forEach(f => {
            touchField(f);
            validateField(f);
        });

        const e: Record<string, string> = {};
        if (name.trim().length < 2 || name.trim().length > 128) e.name = "Имя должно быть длиной от 2 до 128 символов";
        const h = parseFloat(height);
        if (!isFinite(h) || h <= 0) e.height = "Рост должен быть числом больше 0";
        if (nameStatus === "taken") e.nameUnique = "Имя должно быть уникальным";

        if (!eyeColor) e.eyeColor = "Выберите значение";

        if (useExistingCoords) {
            if (!coordId) e.coord = "Выберите координаты";
        } else {
            const x = parseInt(coordX, 10);
            const y = parseFloat(coordY);
            if (!Number.isInteger(x) || x < -917) e.coordX = "coord.x целое ≥ -917";
            if (!isFinite(y)) e.coordY = "coord.y число";
        }

        if (useExistingLocation) {
            if (!locId) e.location = "Выберите локацию";
        } else {
            const lx = parseInt(locX, 10);
            const ly = parseFloat(locY);
            const lz = parseInt(locZ, 10);
            if (!Number.isInteger(lx)) e.locX = "loc.x целое";
            if (!isFinite(ly)) e.locY = "loc.y число";
            if (!Number.isInteger(lz)) e.locZ = "loc.z целое";
            if (locName.trim().length === 0) e.locName = "loc.name обязателен";
        }

        const combined = { ...errors, ...e };
        setErrors(combined);
        return Object.keys(combined).length === 0;
    }

    useEffect(() => {
        if (useExistingCoords) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.coordX; delete next.coordY; delete next.coord;
                return next;
            });
        }
    }, [useExistingCoords]);

    useEffect(() => {
        if (useExistingLocation) {
            setErrors(prev => {
                const next = { ...prev };
                delete next.locX; delete next.locY; delete next.locZ; delete next.locName; delete next.location;
                return next;
            });
        }
    }, [useExistingLocation]);

    useEffect(() => {
        const trimmed = name.trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (trimmed.length < 2) {
            setNameStatus("idle");
            setErrors(prev => {
                const next = { ...prev };
                delete next.nameUnique;
                return next;
            });
            return;
        }
        setNameStatus("checking");
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/persons/check-name?name=${encodeURIComponent(trimmed)}`, {
                    headers: { ...USER_HEADERS },
                });
                if (!res.ok) throw new Error(await res.text());
                const json = await res.json();
                if (json.available) {
                    setNameStatus("available");
                    setErrors(prev => {
                        const next = { ...prev };
                        delete next.nameUnique;
                        return next;
                    });
                } else {
                    setNameStatus("taken");
                    setErrors(prev => ({ ...prev, nameUnique: "Имя уже используется другим персонажем" }));
                }
            } catch (err) {
                console.error("Failed to check name", err);
                setNameStatus("idle");
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [name]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const person: Person = {
            name: name.trim(),
            coordinates: useExistingCoords
                ? ({ id: coordId! } as any)
                : ({ x: parseInt(coordX, 10), y: parseFloat(coordY) } as any),
            creationDate: null as any, // сервер заполнит
            eyeColor: eyeColor as any,
            hairColor: hairColor ? (hairColor as any) : null,
            location: useExistingLocation
                ? ({ id: locId! } as any)
                : ({
                    x: parseInt(locX, 10),
                    y: parseFloat(locY),
                    z: parseInt(locZ, 10),
                    name: locName.trim(),
                } as any),
            height: parseFloat(height),
            nationality: nationality ? (nationality as any) : null,
        };

        try {
            setLoading(true);
            const created = await api.create({ person });
            onCreated && onCreated(created);
            // сброс формы (минимальный)
            setName("");
            setEyeColor("");
            setHairColor("");
            setHeight("");
            setNationality("");
            setCoordId(null);
            setLocId(null);
            setCoordX(""); setCoordY("");
            setLocX(""); setLocY(""); setLocZ(""); setLocName("");
            setNameStatus("idle");
        } catch (err: any) {
            setErrors((p) => ({ ...p, server: err?.message || "Ошибка сервера" }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
                <div className="flex items-center gap-2">
                    <Label>Имя</Label>
                    <span className="text-xs text-muted-foreground">— должно быть уникальным</span>
                </div>
                <Input
                    className="bg-white"
                    value={name}
                    onChange={e => { setName(e.target.value); touchField('name'); validateField('name', e.target.value); }}
                />
                {nameStatus === "checking" && <p className="text-xs text-muted-foreground mt-1">Проверяем доступность...</p>}
                {nameStatus === "available" && <p className="text-xs text-green-600 mt-1">Имя свободно</p>}
                {errors.name && touched.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                {errors.nameUnique && <p className="text-red-600 text-sm">{errors.nameUnique}</p>}
            </div>

            {/* Coordinates */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="font-semibold">Coordinates</div>
                    <label className="ml-2 inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={useExistingCoords}
                            onChange={e => setUseExistingCoords(e.target.checked)}
                        />
                        выбрать существующие
                    </label>
                </div>

                {useExistingCoords ? (
                    <CoordinatesPicker valueId={coordId} onChangeId={setCoordId} />
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>coord.x</Label>
                            <Input
                                className="bg-white"
                                value={coordX}
                                onChange={e => { setCoordX(e.target.value); touchField('coordX'); validateField('coordX', e.target.value); }}
                            />
                            {errors.coordX && touched.coordX && <p className="text-red-600 text-sm">{errors.coordX}</p>}
                        </div>
                        <div>
                            <Label>coord.y</Label>
                            <Input
                                className="bg-white"
                                value={coordY}
                                onChange={e => { setCoordY(e.target.value); touchField('coordY'); validateField('coordY', e.target.value); }}
                            />
                            {errors.coordY && touched.coordY && <p className="text-red-600 text-sm">{errors.coordY}</p>}
                        </div>
                    </div>
                )}
                {errors.coord && <p className="text-red-600 text-sm">{errors.coord}</p>}
            </div>

            {/* Eye/Hair/Height */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <Label>Цвет глаз</Label>
                    <Select value={eyeColor || ''} onValueChange={(v) => setEyeColor(v as any)}>
                        <SelectTrigger><SelectValue placeholder="— выбрать —" /></SelectTrigger>
                        <SelectContent>
                            {eyeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.eyeColor && <p className="text-red-600 text-sm">{errors.eyeColor}</p>}
                </div>
                <div>
                    <Label>Цвет волос (опц.)</Label>
                    <Select
                        // 👇 если null — показываем placeholder, управляем через маркер
                        value={hairColor ?? NONE}
                        onValueChange={(v) => setHairColor(v === NONE ? null : (v as any))}
                    >
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                            {/* 👇 пункт "нет значения" со специальным value, НЕ пустая строка */}
                            <SelectItem value={NONE}>—</SelectItem>
                            {hairOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Рост</Label>
                    <Input
                        className="bg-white"
                        value={height}
                        onChange={e => { setHeight(e.target.value); touchField('height'); validateField('height', e.target.value); }}
                    />
                    {errors.height && touched.height && <p className="text-red-600 text-sm">{errors.height}</p>}
                </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="font-semibold">Location</div>
                    <label className="ml-2 inline-flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={useExistingLocation}
                            onChange={e => setUseExistingLocation(e.target.checked)}
                        />
                        выбрать существующие
                    </label>
                </div>

                {useExistingLocation ? (
                    <LocationPicker valueId={locId} onChangeId={setLocId} />
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>loc.x</Label>
                                <Input
                                    className="bg-white"
                                    value={locX}
                                    onChange={e => { setLocX(e.target.value); touchField('locX'); validateField('locX', e.target.value); }}
                                />
                                {errors.locX && touched.locX && <p className="text-red-600 text-sm">{errors.locX}</p>}
                            </div>
                            <div>
                                <Label>loc.y</Label>
                                <Input
                                    className="bg-white"
                                    value={locY}
                                    onChange={e => { setLocY(e.target.value); touchField('locY'); validateField('locY', e.target.value); }}
                                />
                                {errors.locY && touched.locY && <p className="text-red-600 text-sm">{errors.locY}</p>}
                            </div>
                            <div>
                                <Label>loc.z</Label>
                                <Input
                                    className="bg-white"
                                    value={locZ}
                                    onChange={e => { setLocZ(e.target.value); touchField('locZ'); validateField('locZ', e.target.value); }}
                                />
                                {errors.locZ && touched.locZ && <p className="text-red-600 text-sm">{errors.locZ}</p>}
                            </div>
                        </div>
                        <div>
                            <Label>loc.name</Label>
                            <Input
                                className="bg-white"
                                value={locName}
                                onChange={e => { setLocName(e.target.value); touchField('locName'); validateField('locName', e.target.value); }}
                            />
                            {errors.locName && touched.locName && <p className="text-red-600 text-sm">{errors.locName}</p>}
                        </div>
                    </>
                )}
                {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
            </div>

            {/* Nationality */}
            <div>
                <Label>Национальность (опц.)</Label>
                <Select
                    value={nationality ?? NONE}
                    onValueChange={(v) => setNationality(v === NONE ? null : (v as any))}
                >
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {nationOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {errors.server && <p className="text-red-600 text-sm">{errors.server}</p>}

            <Button type="submit" disabled={loading}>
                {loading ? 'Создаю…' : 'Создать персонажа'}
            </Button>
        </form>
    );
}
