CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`full_access` integer DEFAULT false NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
ALTER TABLE `admin_users` ADD `role_id` text;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
INSERT INTO `roles` (`id`, `name`, `full_access`, `permissions`, `is_system`, `created_at`) VALUES ('role-admin', 'Administrador', 1, '[]', 1, CAST(strftime('%s','now') AS integer) * 1000);--> statement-breakpoint
UPDATE `admin_users` SET `role_id` = 'role-admin';
