'use client'
import React, {useState} from "react";
import { Coordinates, CoordinatesControllerApi } from "../api";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

const api = new CoordinatesControllerApi();

export default function CreateCoordinatesForm() {
    const [x, setX] = useState("");
    const [y, setY] = useState("");
    const [errors, setErrors] = useState<Record<string,string>>({});
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState<Coordinates | null>(null);

    function validate(): boolean {
        const e: Record<string,string> = {};
        const xv = parseInt(x, 10);
        const yv = parseFloat(y);
        if (isNaN(xv)) {
            e.x = "x должен быть целым числом";
        } else if (xv < -917) {
            e.x = "x должно быть ≥ -917";
        }
        if (isNaN(yv)) {
            e.y = "y должен быть числом";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate()) return;
        const dto: Coordinates = {
            x: parseInt(x, 10),
            y: parseFloat(y),
        };
        try {
            setLoading(true);
            setCreated(null);
            const res = await api.create2({ coordinates: dto });
            setCreated(res);
        } catch (err: any) {
            setErrors(prev => ({ ...prev, server: err?.message || "Ошибка сервера" }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div>
                <Label htmlFor="coordX">x</Label>
                <Input id="coordX" value={x} onChange={e => setX(e.target.value)} />
                {errors.x && <p className="text-red-600 text-sm">{errors.x}</p>}
            </div>

            <div>
                <Label htmlFor="coordY">y</Label>
                <Input id="coordY" value={y} onChange={e => setY(e.target.value)} />
                {errors.y && <p className="text-red-600 text-sm">{errors.y}</p>}
            </div>

            {errors.server && <p className="text-red-600 text-sm">{errors.server}</p>}

            <div>
                <Button type="submit" disabled={loading}>
                    {loading ? "Создаю..." : "Создать координаты"}
                </Button>
            </div>

            {created && (
                <div className="mt-3 text-green-600">
                    Координаты созданы. x: {created.x}, y: {created.y}
                </div>
            )}
        </form>
    );
}
