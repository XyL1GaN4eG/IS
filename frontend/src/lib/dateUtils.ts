// src/lib/dateUtils.ts  (замени/положи сюда)
export function parseServerDate(value: any): Date | null {
    if (value == null) return null;

    // 1) массивы [y,mo,d, h?,mi?,ss?, nanos?]
    if (Array.isArray(value)) {
        const arr = value.map((v: any) => (v === null || v === undefined) ? null : Number(v));
        const y = arr[0];
        const mo = arr[1] ?? 1;
        const d = arr[2] ?? 1;
        const h = arr[3] ?? 0;
        const mi = arr[4] ?? 0;
        const ss = arr[5] ?? 0;
        const nanos = arr[6] ?? 0; // наносекунды

        if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(d)) {
            // вычислим миллисекунды
            const msFromNanos = Math.floor((Number(nanos) || 0) / 1_000_000); // nanos -> ms
            // JS Date(year, monthIndex, day, hour, minute, second, ms) создает локальную дату
            return new Date(
                Number(y),
                Math.max(0, Number(mo) - 1),
                Number(d),
                Number(h),
                Number(mi),
                Number(ss),
                msFromNanos
            );
        }
        return null;
    }

    // 2) number — может быть epoch seconds (с дробной частью) или millis
    if (typeof value === "number") {
        // если похоже на миллисекунды (более 1e12)
        if (value > 1e12) return new Date(Math.floor(value));
        return new Date(Math.floor(value * 1000)); // seconds -> ms
    }

    // 3) string
    if (typeof value === "string") {
        const s = value.trim();
        // ISO с TZ или Z
        if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
            const dt = new Date(s);
            if (!isNaN(dt.getTime())) return dt;
        }
        // local-like "YYYY-MM-DDTHH:mm:ss" (без TZ) — распарсим как локальное время
        const isoNoTZ = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):?(\d{2})?/;
        const m = s.match(isoNoTZ);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            const d = Number(m[3]);
            const hh = Number(m[4]);
            const mm = Number(m[5]);
            const ss = Number(m[6] ?? 0);
            return new Date(y, mo - 1, d, hh, mm, ss);
        }
        // fallback to Date.parse
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // 4) уже Date
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    return null;
}

export function formatAnyDate(value: any): string {
    const dt = parseServerDate(value);
    if (!dt) return value;
    return dt.toLocaleString(); // можно заменить на формат по вкусу
}
