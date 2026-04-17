import { db } from "../client";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notes } from "../schema";
import { eq } from "drizzle-orm";

type CreateNote = InferInsertModel<typeof notes>;
type ReadNote = InferSelectModel<typeof notes>;

export const createNote = async (data: CreateNote) => {
  return await db.insert(notes).values(data);
};

export const getNotesByUser = async (userId: ReadNote["userId"]) => {
  return await db.select().from(notes).where(eq(notes.userId, userId));
};
