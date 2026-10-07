import { asc, desc, eq, InferInsertModel, sql } from "drizzle-orm";
import { db } from "../client";
import { workspaces } from "../schema";

type CreateWorkspace = InferInsertModel<typeof workspaces>;
type UpdateWorkspace = Partial<Pick<CreateWorkspace, "name">>;

export const createWorkspace = async (data: CreateWorkspace) => {
  const [workspace] = await db.insert(workspaces).values(data).returning();
  return workspace;
};

export const listWorkspaces = async () => {
  return await db
    .select()
    .from(workspaces)
    .orderBy(desc(workspaces.updatedAt), asc(workspaces.name));
};

export const getWorkspace = async (id: string) => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, id));

  return workspace;
};

export const getFirstWorkspace = async () => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .orderBy(asc(workspaces.createdAt))
    .limit(1);

  return workspace;
};

export const updateWorkspace = async (
  id: string,
  data: UpdateWorkspace,
  _scopeId?: string,
) => {
  const [workspace] = await db
    .update(workspaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspaces.id, id))
    .returning();

  return workspace;
};

export const deleteWorkspace = async (id: string, _scopeId?: string) => {
  const [workspace] = await db
    .delete(workspaces)
    .where(eq(workspaces.id, id))
    .returning();

  return workspace;
};

export const countWorkspaces = async () => {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces);

  return result?.count ?? 0;
};
