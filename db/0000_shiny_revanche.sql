CREATE TABLE "chest_opening_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"chest_type_id" text NOT NULL,
	"received_item_type_id" text NOT NULL,
	"received_item_rarity" text NOT NULL,
	"cost" integer NOT NULL,
	"currency_type" text NOT NULL,
	"opened_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" text NOT NULL,
	"username" text,
	"coins" numeric(20, 2) DEFAULT '0',
	"gems" integer DEFAULT 0,
	"total_taps" integer DEFAULT 0,
	"total_coins_per_tap" numeric(10, 2) DEFAULT '0.1',
	"total_offline_storage" integer DEFAULT 100,
	"total_luck" integer DEFAULT 0,
	"total_crit_chance" integer DEFAULT 0,
	"has_auto_tap" boolean DEFAULT false,
	"last_active" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "players_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "swords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sword_type_id" text NOT NULL,
	"owned_by" uuid NOT NULL,
	"is_equipped" boolean DEFAULT false,
	"acquired_at" timestamp DEFAULT now(),
	"equipped_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "chest_opening_logs" ADD CONSTRAINT "chest_opening_logs_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swords" ADD CONSTRAINT "swords_owned_by_players_id_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;