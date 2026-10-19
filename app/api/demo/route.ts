import { env } from "cloudflare:workers";
import { api, database, identity, json } from "../../../lib/server";
export async function POST(r: Request) {
    return api(async () => {
        // Optional deployment-only secret permits initial fixtures before the first visitor signs in.
        // This grants sample-data insertion only, never user identity or booking access.
        const seedKey = (env as unknown as Record<string, string | undefined>).SLOTWISE_SEED_KEY;
        const bootstrap = seedKey && r.headers.get("authorization") === `Bearer ${seedKey}`;
        if (!bootstrap) await identity(r);
        const db = database(), now = Date.now();
        const people = [['demo-asha', 'Asha Mehta', 'Software engineer · Backend systems', 'Software engineering', 'Build confidence in backend development, API design, and technical interviews. Bring a problem you are working through.', 'mint'], ['demo-arjun', 'Arjun Rao', 'Product designer · Design systems', 'Design', 'Work through portfolio reviews, product thinking, and designing interfaces that make complex tasks feel simple.', 'peach'], ['demo-neha', 'Neha Shah', 'Data engineer · Analytics & AI', 'Data & AI', 'Explore data pipelines, practical machine learning, and navigating your first role in data engineering.', 'lilac']];
        const statements = [];
        for (const [id, name, title, specialty, bio, color] of people) {
            statements.push(db.prepare("INSERT OR IGNORE INTO mentors(id,owner_id,name,title,specialty,bio,color,demo,created_at) VALUES(?,?,?,?,?,?,?,1,?)").bind(id, 'system:' + id, name, title, specialty, bio, color, now));
            // Fixed 09:00–12:00 UTC. Every visitor sees these same instants in their own timezone.
            for (let day = 1; day <= 7; day++) {
                const d = new Date(now);
                d.setUTCDate(d.getUTCDate() + day);
                d.setUTCHours(9, 0, 0, 0);
                for (let h = 0; h < 6; h++) {
                    const start = d.getTime() + h * 1800000;
                    statements.push(db.prepare("INSERT OR IGNORE INTO slots(id,mentor_id,starts_at,ends_at) VALUES(?,?,?,?)").bind(`${id}-${start}`, id, start, start + 1800000));
                }
            }
        }
        // Stay within D1 batch statement limits; each chunk is safe to repeat.
        for (let i = 0; i < statements.length; i += 40)
            await db.batch(statements.slice(i, i + 40));
        return json({ ok: true });
    });
}
