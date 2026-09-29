CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`note` text,
	`stripe_customer_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text NOT NULL,
	`qty` integer NOT NULL,
	`price` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`seq` integer NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`payment_intent_id` text,
	`subtotal` integer NOT NULL,
	`shipping_cost` integer DEFAULT 0 NOT NULL,
	`tax` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`shipping_address` text NOT NULL,
	`shipping_provider` text,
	`shipping_service` text,
	`shipping_label` text,
	`carrier` text,
	`tracking` text,
	`tracking_url` text,
	`tracking_status` text,
	`label_url` text,
	`shippo_transaction_id` text,
	`shipped_at` integer,
	`delivered_at` integer,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_seq_unique` ON `orders` (`seq`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_unique` ON `orders` (`number`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`sku` text NOT NULL,
	`price` integer NOT NULL,
	`compare_at` integer,
	`description` text DEFAULT '' NOT NULL,
	`specs` text DEFAULT '[]' NOT NULL,
	`image` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock_at` integer DEFAULT 10 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`model3d` text,
	`featured` integer DEFAULT false NOT NULL,
	`badge` text,
	`sold_30d` integer DEFAULT 0 NOT NULL,
	`weight_oz` real DEFAULT 8 NOT NULL,
	`dim_l` real DEFAULT 8 NOT NULL,
	`dim_w` real DEFAULT 6 NOT NULL,
	`dim_h` real DEFAULT 3 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`order_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
