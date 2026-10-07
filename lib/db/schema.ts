import { vector } from "drizzle-orm/pg-core";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workspaces = pgTable(
  "workspace",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    ownerUserId: uuid("ownerUserId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    ownerUserIdIdx: index("workspace_owner_user_id_idx").on(table.ownerUserId),
  }),
);

export const projects = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("project_workspace_id_idx").on(table.workspaceId),
  }),
);

export const notes = pgTable(
  "note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content"),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("projectId").references(() => projects.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("note_workspace_id_idx").on(table.workspaceId),
  }),
);

export const chats = pgTable(
  "chat",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull().default("New Chat"),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("chat_workspace_id_idx").on(table.workspaceId),
  }),
);

export const chatMessages = pgTable("chat_message", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
    workspaceId: uuid("workspaceId")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 384 }),
    sourceText: text("source_text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    workspaceIdIdx: index("note_embedding_workspace_id_idx").on(
      table.workspaceId,
    ),
    userWorkspaceIdx: index("note_embedding_user_workspace_idx").on(
      table.userId,
      table.workspaceId,
    ),
  }),
);
