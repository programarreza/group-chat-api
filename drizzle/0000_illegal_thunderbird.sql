CREATE TABLE "messages" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"room_id" varchar(50) NOT NULL,
	"username" varchar(24) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(32) NOT NULL,
	"created_by" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"username" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
