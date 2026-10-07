import { vector } from "drizzle-orm/pg-core";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
    chunkCount: integer("chunk_count").notNull().default(0),
    embeddingStatus: text("embedding_status")
      .notNull()
      .$type<"pending" | "processing" | "completed" | "failed">()
      .default("pending"),
    embeddingError: text("embedding_error"),
    embeddingUpdatedAt: timestamp("embedding_updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("context_item_created_at_idx").on(table.createdAt),
  }),
);

export const contextChunks = pgTable(
  "context_chunk",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contextId: uuid("context_id")
      .notNull()
      .references(() => contextItems.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    startChar: integer("start_char").notNull(),
    endChar: integer("end_char").notNull(),
    characterCount: integer("character_count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    contextChunkIdx: uniqueIndex("context_chunk_context_index_idx").on(
      table.contextId,
      table.chunkIndex,
    ),
    contextIdIdx: index("context_chunk_context_id_idx").on(table.contextId),
  }),
);

export const contextEmbeddings = pgTable(
  "context_chunk_embedding",
  {
    chunkId: uuid("chunk_id")
      .primaryKey()
      .references(() => contextChunks.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 384 }),
    model: text("model").notNull(),
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
