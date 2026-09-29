ALTER TABLE `order_items` ADD `color` text;--> statement-breakpoint
ALTER TABLE `products` ADD `colors` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `color_images` text DEFAULT '{}' NOT NULL;