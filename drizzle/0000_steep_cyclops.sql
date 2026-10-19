CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`topic` text NOT NULL,
	`starts_at` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_booking_per_slot` ON `bookings` (`slot_id`) WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE UNIQUE INDEX `one_active_booking_per_learner_time` ON `bookings` (`user_id`,`starts_at`) WHERE "bookings"."status" = 'confirmed';--> statement-breakpoint
CREATE INDEX `booking_user` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE TABLE `booking_events` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mentors` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`specialty` text NOT NULL,
	`bio` text NOT NULL,
	`color` text DEFAULT 'mint' NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mentors_owner_id_unique` ON `mentors` (`owner_id`);--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`mentor_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	FOREIGN KEY (`mentor_id`) REFERENCES `mentors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mentor_start` ON `slots` (`mentor_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `slots_start` ON `slots` (`starts_at`);