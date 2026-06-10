PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_mind_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`mind` text,
	`config` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_mind_template`("id", "name", "description", "mind", "created_at", "updated_at") SELECT "id", "name", "description", "mind", "created_at", "updated_at" FROM `mind_template`;--> statement-breakpoint
DROP TABLE `mind_template`;--> statement-breakpoint
ALTER TABLE `__new_mind_template` RENAME TO `mind_template`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `mind_template_name_idx` ON `mind_template` (`name`);