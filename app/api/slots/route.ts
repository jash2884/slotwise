import { z } from "zod";
import { api, database, identity, json, HttpError } from "../../../lib/server";
export async function POST(r: Request) {
    return api(async () => {
        const u = await identity(r), p = z.object({ startsAt: z.number().int() }).parse(await r.json()), db = database(), now = Date.now();
        if (p.startsAt <= now || p.startsAt > now + 90 * 86400000 || p.startsAt % 1800000 !== 0)
            throw new HttpError(400, "Choose a future half-hour slot within the next 90 days.");
        const m = await db.prepare("SELECT id FROM mentors WHERE owner_id=?").bind(u.userId).first<{
            id: string;
        }>();
        if (!m)
            throw new HttpError(403, "Create your mentor profile first.");
        await db.prepare("INSERT INTO slots(id,mentor_id,starts_at,ends_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(), m.id, p.startsAt, p.startsAt + 1800000).run();
        return json({ ok: true }, 201);
    });
}
export async function DELETE(r: Request) {
    return api(async () => {
        const u = await identity(r), p = z.object({ id: z.string().min(1).max(100) }).parse(await r.json()), db = database();
        // Keep historical slots referenced by bookings; only unused slots can be removed.
        const result = await db.prepare("DELETE FROM slots WHERE id=? AND mentor_id IN(SELECT id FROM mentors WHERE owner_id=?) AND NOT EXISTS(SELECT 1 FROM bookings WHERE slot_id=slots.id)").bind(p.id, u.userId).run();
        if (!result.meta.changes)
            throw new HttpError(409, "This slot is unavailable or has booking history. Slots with booking history cannot be deleted.");
        return json({ ok: true });
    });
}
