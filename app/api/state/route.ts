import { api, database, json } from "../../../lib/server";
import { getUser } from "../../auth";
export const dynamic = "force-dynamic";
export async function GET() {
    return api(async () => {
        const user = await getUser(), db = database(), now = Date.now();
        const mentors = (await db.prepare("SELECT id,name,title,specialty,bio,color,demo,owner_id = ? AS owned FROM mentors ORDER BY demo ASC,name ASC").bind(user?.userId ?? "").all()).results;
        const slots = (await db.prepare("SELECT s.*, EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='confirmed') AS taken FROM slots s WHERE s.starts_at>? ORDER BY s.starts_at LIMIT 2000").bind(now).all()).results;
        const appointments = user ? (await db.prepare(`SELECT b.*,m.name AS mentor_name,m.title AS mentor_title,m.color,m.owner_id = ? AS hosting,s.ends_at FROM bookings b JOIN slots s ON b.slot_id=s.id JOIN mentors m ON s.mentor_id=m.id WHERE b.user_id=? OR m.owner_id=? ORDER BY b.starts_at DESC LIMIT 200`).bind(user.userId, user.userId, user.userId).all()).results : [];
        return json({ user: user ? { name: user.fullName ?? user.email.split('@')[0], email: user.email } : null, mentors, slots, appointments });
    });
}
