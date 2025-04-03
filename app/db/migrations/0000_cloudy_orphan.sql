CREATE TABLE `calls` (
	`call_id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`status` text NOT NULL,
	`requested_at` integer NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`duration_sec` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_variables` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`customer_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`customer_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone_number` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
