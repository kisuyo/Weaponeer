CREATE TABLE "chest_loot_table" (
	"id" uuid DEFAULT gen_random_uuid(),
	"chest_type_id" uuid NOT NULL,
	"item_type_id" uuid NOT NULL,
	"drop_weight" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chest_loot_table_chest_type_id_item_type_id_pk" PRIMARY KEY("chest_type_id","item_type_id")
);
--> statement-breakpoint
CREATE TABLE "chest_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"cost" integer NOT NULL,
	"currency_type" text NOT NULL,
	"guaranteed_rarity_min" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chest_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "item_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"rarity_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"attributes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"item_type_id" uuid NOT NULL,
	"is_equipped" boolean DEFAULT false,
	"acquired_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" text NOT NULL,
	"username" text,
	"coins" numeric(20, 2) DEFAULT '0',
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
CREATE TABLE "rarities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"drop_weight" integer NOT NULL,
	"color_hex" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "rarities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "chest_loot_table" ADD CONSTRAINT "chest_loot_table_chest_type_id_chest_types_id_fk" FOREIGN KEY ("chest_type_id") REFERENCES "public"."chest_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chest_loot_table" ADD CONSTRAINT "chest_loot_table_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_rarity_id_rarities_id_fk" FOREIGN KEY ("rarity_id") REFERENCES "public"."rarities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_items" ADD CONSTRAINT "player_items_item_type_id_item_types_id_fk" FOREIGN KEY ("item_type_id") REFERENCES "public"."item_types"("id") ON DELETE no action ON UPDATE no action;