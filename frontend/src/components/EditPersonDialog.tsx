'use client'
import React, { useMemo, useState } from "react";
import {
    Person,
    PersonControllerApi,
    PersonEyeColorEnum,
    PersonHairColorEnum,
    PersonNationalityEnum,
    Coordinates,
    Location,
} from "../api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatAnyDate } from "@/src/lib/dateUtils";

const api = new PersonControllerApi();

// служебное значение для «нет значения» в Radix Select
const NONE = "__none__";

export default function EditPersonDialog({
                                             isOpen,
                                             onClose,
                                             person,
                                             onSaved,
                                         }: {
    isOpen: boolean;
    onClose: () => void;
    person: Person;
    onSaved?: () => void;
}) {
    // базовые поля
    const [name, setName] = useState(person.name ?? "");
    const [height, setHeight] = useState(String(person.height ?? ""));
    const [eyeColor, setEyeColor] = useState<PersonEyeColorEnum>(person.eyeColor as PersonEyeColorEnum);
    const [hairColor, setHairColor] = useState<string>(
        (person.hairColor as PersonHairColorEnum | undefined) ?? NONE
    );
    const [nationality, setNationality] = useState<string>(
        (person.nationality as PersonNationalityEnum | undefined) ?? NONE
    );

    // вложенные объекты (редактируем простыми полями)
    const [coordX, setCoordX] = useState(String(person.coordinates?.x ?? ""));
    const [coordY, setCoordY] = useState(String(person.coordinates?.y ?? ""));
    const [locX, setLocX] = useState(String(person.location?.x ?? ""));
    const [locY, setLocY] = useState(String(person.location?.y ?? ""));
    const [locZ, setLocZ] = useState(String(person.location?.z ?? ""));
    const [locName, setLocName] = useState(String(person.location?.name ?? ""));

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const eyeOptions = useMemo(() => Object.values(PersonEyeColorEnum), []);
    const hairOptions = useMemo(() => Object.values(PersonHairColorEnum), []);
    const nationOptions = useMemo(() => Object.values(PersonNationalityEnum), []);

    function validate(): boolean {
        const e: Record<string, string> = {};

        if (!name.trim()) e.name = "Имя не может быть пустым";

        const h = Number(height);
        if (!Number.isFinite(h) || h <= 0) e.height = "Рост должен быть числом > 0";

        const cx = Number(coordX), cy = Number(coordY);
        if (!Number.isInteger(cx) || cx < -917) e.coordX = "coord.x — целое, ≥ -917";
        if (!Number.isFinite(cy)) e.coordY = "coord.y — число";

        const lx = Number(locX), ly = Number(locY), lz = Number(locZ);
        if (!Number.isInteger(lx)) e.locX = "loc.x — целое";
        if (!Number.isFinite(ly)) e.locY = "loc.y — число";
        if (!Number.isInteger(lz)) e.locZ = "loc.z — целое";

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSave(ev?: React.FormEvent) {
        ev?.preventDefault();
        if (!validate()) return;

        // собираем DTO, НЕ кладя creationDate
        const coords: Coordinates = { x: Number(coordX), y: Number(coordY) } as any;
        const loc: Location = {
            x: Number(locX),
            y: Number(locY),
            z: Number(locZ),
            name: locName.trim() || null,
        } as any;

        const payload: any = {
            name: name.trim(),
            coordinates: coords,
            eyeColor,
            hairColor: hairColor === NONE ? null : (hairColor as PersonHairColorEnum),
            location: loc,
            height: Number(height),
            nationality: nationality === NONE ? null : (nationality as PersonNationalityEnum),
            // ВАЖНО: creationDate НЕ отправляем, чтобы клиент не пытался вызвать .toISOString()
        };

        try {
            setSaving(true);
            // у некоторых генераторов метод называется иначе: update / update1 / put
            if ((api as any).update) {
                await (api as any).update({ id: person.id as number, person: payload });
            } else if ((api as any).put) {
                await (api as any).put({ id: person.id as number, person: payload });
            } else {
                // если метод вдруг сгенерировался с другим именем
                // @ts-ignore
                await api["update1"]?.({ id: person.id as number, person: payload });
            }
            onSaved?.();
            onClose();
        } catch (err: any) {
            setErrors(prev => ({ ...prev, server: err?.message || "Ошибка сохранения" }));
        } finally {
            setSaving(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Редактировать персонажа #{person.id}</h3>

            {/* только просмотр */}
            <div className="text-sm text-muted-foreground">
                Создан: <span className="font-medium text-foreground">{formatAnyDate(person.creationDate)}</span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <Label htmlFor="pname">Имя</Label>
                    <Input id="pname" value={name} onChange={e => setName(e.target.value)} />
                    {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label>Цвет глаз</Label>
                        <Select value={eyeColor} onValueChange={(v) => setEyeColor(v as PersonEyeColorEnum)}>
                            <SelectTrigger><SelectValue placeholder="Выбрать" /></SelectTrigger>
                            <SelectContent>
                                {eyeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Цвет волос (опц.)</Label>
                        <Select value={hairColor} onValueChange={setHairColor}>
                            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NONE}>—</SelectItem>
                                {hairOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="height">Рост</Label>
                        <Input id="height" value={height} onChange={e => setHeight(e.target.value)} />
                        {errors.height && <p className="text-red-600 text-sm">{errors.height}</p>}
                    </div>
                </div>

                <div className="border-t pt-3">
                    <div className="font-medium mb-2">Координаты</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="cx">coord.x</Label>
                            <Input id="cx" value={coordX} onChange={e => setCoordX(e.target.value)} />
                            {errors.coordX && <p className="text-red-600 text-sm">{errors.coordX}</p>}
                        </div>
                        <div>
                            <Label htmlFor="cy">coord.y</Label>
                            <Input id="cy" value={coordY} onChange={e => setCoordY(e.target.value)} />
                            {errors.coordY && <p className="text-red-600 text-sm">{errors.coordY}</p>}
                        </div>
                    </div>
                </div>

                <div className="border-t pt-3">
                    <div className="font-medium mb-2">Локация</div>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <Label htmlFor="lx">loc.x</Label>
                            <Input id="lx" value={locX} onChange={e => setLocX(e.target.value)} />
                            {errors.locX && <p className="text-red-600 text-sm">{errors.locX}</p>}
                        </div>
                        <div>
                            <Label htmlFor="ly">loc.y</Label>
                            <Input id="ly" value={locY} onChange={e => setLocY(e.target.value)} />
                            {errors.locY && <p className="text-red-600 text-sm">{errors.locY}</p>}
                        </div>
                        <div>
                            <Label htmlFor="lz">loc.z</Label>
                            <Input id="lz" value={locZ} onChange={e => setLocZ(e.target.value)} />
                            {errors.locZ && <p className="text-red-600 text-sm">{errors.locZ}</p>}
                        </div>
                        <div className="col-span-4 sm:col-span-1">
                            <Label htmlFor="lname">Название (опц.)</Label>
                            <Input id="lname" value={locName} onChange={e => setLocName(e.target.value)} />
                            {errors.locName && <p className="text-red-600 text-sm">{errors.locName}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <Label>Национальность (опц.)</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {nationOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {errors.server && <div className="text-red-600">{errors.server}</div>}

                <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={saving}>{saving ? "Сохраняю…" : "Сохранить"}</Button>
                    <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
                </div>
            </form>
        </div>
    );
}
