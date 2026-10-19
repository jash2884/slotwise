import { z } from "zod";
import { api, database, identity, json } from "../../../lib/server";
const schema = z.object({ name: z.string().trim().min(2).max(60), title: z.string().trim().min(3).max(100), specialty: z.enum(["Software engineering", "Career guidance", "Design", "Data & AI"]), bio: z.string().trim().min(20).max(600) });
export async function POST(r: Request) {
    return api(async () => {
        const u = await identity(r), p = schema.parse(await r.json()), db = database();
        await db.prepare(`INSERT INTO mentors(id,owner_id,name,title,specialty,bio,color,demo,created_at) VALUES(?,?,?,?,?,?,'mint',0,?) ON CONFLICT(owner_id) DO UPDATE SET name=excluded.name,title=excluded.title,specialty=excluded.specialty,bio=excluded.bio`).bind(crypto.randomUUID(), u.userId, p.name, p.title, p.specialty, p.bio, Date.now()).run();
        return json({ ok: true });
    });
}
