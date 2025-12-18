'use client'
import React, { useState } from "react";
import { Person, PersonControllerApi } from "../api";
import EditPersonDialog from "./EditPersonDialog";
import { Button } from "@/components/ui/button";
import {formatAnyDate} from "@/src/lib/dateUtils";
import { extractApiErrorMessage } from "@/src/lib/apiError";

const api = new PersonControllerApi();

export default function PersonDetail({ person, onClose, onUpdated }: {
    person: Person,
    onClose: () => void,
    onUpdated?: () => void
}) {
    const [showEdit, setShowEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        if (!confirm("Удалить этого персонажа?")) return;
        setDeleting(true);
        setError(null);
        try {
            await api._delete({ id: person.id as any });
            // successful delete -> notify parent
            onUpdated && onUpdated();
            onClose();
        } catch (err: any) {
            setError(await extractApiErrorMessage(err, "Невозможно удалить персонажа"));
        } finally {
            setDeleting(false);
        }
    }
    function formatCreationDate(cd: any) {
        if (!cd) return "—";
        if (Array.isArray(cd)) {
            const [y, mo, d, h = 0, mi = 0, s = 0] = cd;
            const mm = String(mo).padStart(2, "0");
            const dd = String(d).padStart(2, "0");
            return `${y}-${mm}-${dd} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
        if (typeof cd === "number") return new Date(Math.floor(cd * 1000)).toLocaleString();
        if (typeof cd === "string") return new Date(cd).toLocaleString();
        if (cd instanceof Date) return cd.toLocaleString();
        return String(cd);
    }
    return (
        <div className="space-y-3 max-w-md">
            <h2 className="text-xl font-semibold">{person.name} (id: {person.id})</h2>

            <div>
                <b>Creation date:</b> {formatAnyDate(person.creationDate)}
            </div>

            <div>
                <b>Height:</b> {person.height}
            </div>

            <div>
                <b>Eye color:</b> {person.eyeColor}
            </div>

            <div>
                <b>Hair color:</b> {person.hairColor ?? "—"}
            </div>

            <div>
                <b>Nationality:</b> {person.nationality ?? "—"}
            </div>

            <div>
                <b>Coordinates:</b>
                <div>x: {person.coordinates.x}, y: {person.coordinates.y}</div>
            </div>

            <div>
                <b>Location:</b>
                <div>x: {person.location.x}, y: {person.location.y}, z: {person.location.z}, name: {person.location.name ?? "—"}</div>
            </div>

            {error && <div className="text-red-600">{error}</div>}

            <div className="flex gap-2 mt-3">
                <Button onClick={() => setShowEdit(true)}>Редактировать</Button>
                <Button onClick={handleDelete} disabled={deleting}>{deleting ? "Удаляю..." : "Удалить"}</Button>
                <Button variant="ghost" onClick={onClose}>Закрыть</Button>
            </div>

            <EditPersonDialog
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                person={person}
                onSaved={() => { onUpdated && onUpdated(); setShowEdit(false); }}
            />
        </div>
    );

}
