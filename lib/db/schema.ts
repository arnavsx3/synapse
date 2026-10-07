import { vector } from "drizzle-orm/pg-core";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const contextItems = pgTable(
  "context_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull().$type<"text" | "txt" | "md" | "pdf" | "docx">(),
    content: text("content").notNull(),
    characterCount: integer("character_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("context_item_created_at_idx").on(table.createdAt),
  }),
);

export const contextEmbeddings = pgTable(
  "context_embedding",
  {
    contextId: uuid("context_id")
      .primaryKey()
      .references(() => contextItems.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 384 }),
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const chatMessages = pgTable(
  "chat_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    role: text("role").notNull().$type<"user" | "assistant">(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("chat_message_created_at_idx").on(table.createdAt),
  }),
);
