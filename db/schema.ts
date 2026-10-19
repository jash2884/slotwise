import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
export const mentors = sqliteTable("mentors", {
    id: text("id").primaryKey(), ownerId: text("owner_id").notNull().unique(),
    name: text("name").notNull(), title: text("title").notNull(), specialty: text("specialty").notNull(),
    bio: text("bio").notNull(), color: text("color").notNull().default("mint"),
    demo: integer("demo").notNull().default(0), createdAt: integer("created_at").notNull(),
});
export const slots = sqliteTable("slots", {
    id: text("id").primaryKey(), mentorId: text("mentor_id").notNull().references(() => mentors.id),
    startsAt: integer("starts_at").notNull(), endsAt: integer("ends_at").notNull(),
}, t => [uniqueIndex("mentor_start").on(t.mentorId, t.startsAt), index("slots_start").on(t.startsAt)]);
export const bookings = sqliteTable("bookings", {
    id: text("id").primaryKey(), slotId: text("slot_id").notNull().references(() => slots.id),
    userId: text("user_id").notNull(), name: text("name").notNull(), topic: text("topic").notNull(),
    startsAt: integer("starts_at").notNull(), status: text("status").notNull().default("confirmed"),
    createdAt: integer("created_at").notNull(),
}, t => [
    uniqueIndex("one_active_booking_per_slot").on(t.slotId).where(sql `${t.status} = 'confirmed'`),
    uniqueIndex("one_active_booking_per_learner_time").on(t.userId, t.startsAt).where(sql `${t.status} = 'confirmed'`),
    index("booking_user").on(t.userId),
]);
export const events = sqliteTable("booking_events", {
    id: text("id").primaryKey(), bookingId: text("booking_id").notNull().references(() => bookings.id),
    actorId: text("actor_id").notNull(), action: text("action").notNull(), createdAt: integer("created_at").notNull(),
});
