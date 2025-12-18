'use client'
import React, { useState } from "react";
import { Location, LocationControllerApi } from "../api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const api = new LocationControllerApi();

export default function CreateLocationForm({ onCreated }: { onCreated?: (location: Location) => void } = {}) {
    const [x, setX] = useState("");
    const [y, setY] = useState("");
    const [z, setZ] = useState("");
    const [name, setName] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [createdLocation, setCreatedLocation] = useState<Location | null>(null);

    const touchField = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

    const setFieldError = (field: string, message?: string) => {
        setErrors(prev => {
            const next = { ...prev };
            if (message) next[field] = message; else delete next[field];
            return next;
        });
    };

    const validateField = (field: string, value: string) => {
        switch (field) {
            case "x": {
                const xv = parseInt(value, 10);
                if (Number.isNaN(xv)) setFieldError(field, "x должно быть целым числом");
                else setFieldError(field);
                break;
            }
            case "y": {
                const yv = parseFloat(value);
                if (!isFinite(yv)) setFieldError(field, "y должно быть числом");
                else setFieldError(field);
                break;
            }
            case "z": {
                const zv = parseInt(value, 10);
                if (Number.isNaN(zv)) setFieldError(field, "z должно быть целым числом");
                else setFieldError(field);
                break;
            }
            case "name":
                setFieldError(field);
                break;
            default:
                break;
        }
    };

    function validate(): boolean {
        ["x", "y", "z"].forEach(field => touchField(field));
        const e: Record<string, string> = {};
        const xv = parseInt(x, 10);
        const yv = parseFloat(y);
        const zv = parseInt(z, 10);
        if (isNaN(xv)) e.x = "x должно быть целым числом";
        if (isNaN(yv)) e.y = "y должно быть числом";
        if (isNaN(zv)) e.z = "z должно быть целым числом";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        const loc: Location = {
            x: parseInt(x, 10),
            y: parseFloat(y),
            z: parseInt(z, 10),
            name: name.trim() || null,
        };

        try {
            setLoading(true);
            setCreatedLocation(null);
            const res = await api.create1({ location: loc });
            setCreatedLocation(res);
            onCreated && onCreated(res);
        } catch (err: any) {
            console.error(err);
            setErrors(prev => ({ ...prev, server: err.message || "Ошибка сервера" }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="x">x</Label>
                    <Input id="x" className="bg-white" value={x} onChange={e => { setX(e.target.value); touchField("x"); validateField("x", e.target.value); }} />
                    {errors.x && touched.x && <p className="text-red-600 text-sm">{errors.x}</p>}
                </div>
                <div>
                    <Label htmlFor="y">y</Label>
                    <Input id="y" className="bg-white" value={y} onChange={e => { setY(e.target.value); touchField("y"); validateField("y", e.target.value); }} />
                    {errors.y && touched.y && <p className="text-red-600 text-sm">{errors.y}</p>}
                </div>
                <div>
                    <Label htmlFor="z">z</Label>
                    <Input id="z" className="bg-white" value={z} onChange={e => { setZ(e.target.value); touchField("z"); validateField("z", e.target.value); }} />
                    {errors.z && touched.z && <p className="text-red-600 text-sm">{errors.z}</p>}
                </div>
            </div>

            <div>
                <Label htmlFor="name">Название (опц.)</Label>
                    <Input id="name" className="bg-white" value={name} onChange={e => { setName(e.target.value); touchField("name"); validateField("name", e.target.value); }} />
                    {errors.name && touched.name && <p className="text-red-600 text-sm">{errors.name}</p>}
            </div>

            {errors.server && <p className="text-red-600 text-sm">{errors.server}</p>}

            <Button type="submit" disabled={loading}>
                {loading ? "Создаю..." : "Создать локацию"}
            </Button>

            {createdLocation && (
                <div className="mt-4 text-green-600">
                    Локация создана. X: {createdLocation.x}, Y: {createdLocation.y}, Z: {createdLocation.z}
                </div>
            )}
        </form>
    );
}
