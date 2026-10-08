CREATE TABLE `wholesale_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`lang` text DEFAULT 'es' NOT NULL,
	`status` text DEFAULT 'nueva' NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`order_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `is_wholesale` integer DEFAULT false NOT NULL;