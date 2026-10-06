CREATE TABLE `notify_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`product_id` text NOT NULL,
	`lang` text DEFAULT 'es' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notify_requests_email_product` ON `notify_requests` (`email`,`product_id`);