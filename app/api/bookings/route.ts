import { z } from "zod";
import { api, database, identity, json, HttpError } from "../../../lib/server";
export async function POST(r: Request) {
    return api(async () => {
        const u = await identity(r), p = z.object({ slotId: z.string().min(1).max(100), topic: z.string().trim().min(5).max(500) }).parse(await r.json()), db = database();
        const id = r.headers.get("Idempotency-Key") ?? crypto.randomUUID();
        if (!z.string().uuid().safeParse(id).success)
            throw new HttpError(400, "Invalid booking request identifier.");
        const existing = await db.prepare("SELECT id,slot_id,user_id,status FROM bookings WHERE id=?").bind(id).first<{
            id: string;
            slot_id: string;
            user_id: string;
            status: string;
        }>();
        if (existing) {
            if (existing.user_id !== u.userId || existing.slot_id !== p.slotId)
                throw new HttpError(409, "This request identifier was already used.");
            return json({ id, status: existing.status });
        }
        const slot = await db.prepare("SELECT s.*,m.owner_id FROM slots s JOIN mentors m ON s.mentor_id=m.id WHERE s.id=?").bind(p.slotId).first<{
            id: string;
            starts_at: number;
            owner_id: string;
        }>();
        if (!slot || slot.starts_at <= Date.now())
            throw new HttpError(409, "This slot is no longer available.");
        if (slot.owner_id === u.userId)
            throw new HttpError(400, "You cannot book your own session.");
        const now = Date.now();
        // D1 batch is transactional. Partial unique indexes arbitrate simultaneous bookings.
        try {
            await db.batch([
                db.prepare("INSERT INTO bookings(id,slot_id,user_id,name,topic,starts_at,status,created_at) SELECT ?,?,?,?,?,?,'confirmed',? WHERE EXISTS(SELECT 1 FROM slots WHERE id=? AND starts_at>?)").bind(id, p.slotId, u.userId, u.displayName, p.topic, slot.starts_at, now, p.slotId, now),
                db.prepare("INSERT INTO booking_events(id,booking_id,actor_id,action,created_at) SELECT ?,id,?,'created',? FROM bookings WHERE id=?").bind(crypto.randomUUID(), u.userId, now, id),
            ]);
        }
        catch (error) {
            const retry = await db.prepare("SELECT id,slot_id,user_id,status FROM bookings WHERE id=?").bind(id).first<{
                id: string;
                slot_id: string;
                user_id: string;
                status: string;
            }>();
            if (retry && retry.user_id === u.userId && retry.slot_id === p.slotId)
                return json({ id: retry.id, status: retry.status });
            throw error;
        }
        const created = await db.prepare("SELECT id FROM bookings WHERE id=?").bind(id).first();
        if (!created)
            throw new HttpError(409, "This slot is no longer available.");
        return json({ id, status: "confirmed" }, 201);
    });
}
export async function PATCH(r: Request) {
    return api(async () => {
        const u = await identity(r), p = z.object({ id: z.string().uuid() }).parse(await r.json()), db = database();
        const b = await db.prepare("SELECT b.*,m.owner_id FROM bookings b JOIN slots s ON s.id=b.slot_id JOIN mentors m ON m.id=s.mentor_id WHERE b.id=?").bind(p.id).first<{
            user_id: string;
            owner_id: string;
            status: string;
            starts_at: number;
        }>();
        if (!b || (b.user_id !== u.userId && b.owner_id !== u.userId))
            throw new HttpError(404, "Booking not found.");
        if (b.status === 'cancelled')
            return json({ ok: true });
        if (b.starts_at <= Date.now())
            throw new HttpError(400, "Past sessions cannot be cancelled.");
        const now = Date.now();
        await db.batch([
            db.prepare("UPDATE bookings SET status='cancelled' WHERE id=? AND status='confirmed'").bind(p.id),
            db.prepare("INSERT INTO booking_events(id,booking_id,actor_id,action,created_at) VALUES(?,?,?,'cancelled',?)").bind(crypto.randomUUID(), p.id, u.userId, now)
        ]);
        return json({ ok: true });
    });
}
