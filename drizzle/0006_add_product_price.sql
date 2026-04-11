ALTER TABLE `products` ADD `price` integer;--> statement-breakpoint
UPDATE `products` SET `description` = REPLACE(`description`, 'oversitkt', 'oversikt') WHERE `description` LIKE '%oversitkt%';