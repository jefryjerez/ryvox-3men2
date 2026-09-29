CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`order` text DEFAULT '[]' NOT NULL,
	`content` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
