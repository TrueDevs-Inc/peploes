CREATE TYPE "public"."email_delivery_status" AS ENUM('pending', 'accepted', 'rejected', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('smtp', 'resend');--> statement-breakpoint
CREATE TABLE "email_deliveries" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"payload_hash" varchar(64) NOT NULL,
	"template" varchar(64) NOT NULL,
	"provider" "email_provider" NOT NULL,
	"status" "email_delivery_status" NOT NULL,
	"provider_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
