import { vector } from "drizzle-orm/pg-core";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("note", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("projectId").references(() => projects.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chats = pgTable("chat", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default("New Chat"),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_message", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),

    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey(account.provider, account.providerAccountId),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (vt) => ({
    pk: primaryKey(vt.identifier, vt.token),
  }),
);

export const noteEmbeddings = pgTable(
  "note_embedding",
  {
    noteId: uuid("noteId")
      .notNull()
      .primaryKey()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 384 }),
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("note_embedding_user_id_idx").on(table.userId),
  }),
);
