import { and, asc, desc, eq, InferInsertModel, sql } from "drizzle-orm";
import { db } from "../client";
import { workspaces } from "../schema";

type CreateWorkspace = InferInsertModel<typeof workspaces>;
type UpdateWorkspace = Partial<Pick<CreateWorkspace, "name">>;

export const createWorkspace = async (data: CreateWorkspace) => {
  const [workspace] = await db.insert(workspaces).values(data).returning();
  return workspace;
};

export const listWorkspacesByOwner = async (ownerUserId: string) => {
  return await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, ownerUserId))
    .orderBy(desc(workspaces.updatedAt), asc(workspaces.name));
};

export const getWorkspaceByOwner = async (id: string, ownerUserId: string) => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.ownerUserId, ownerUserId)));

  return workspace;
};

export const getFirstWorkspaceByOwner = async (ownerUserId: string) => {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, ownerUserId))
    .orderBy(asc(workspaces.createdAt))
    .limit(1);

  return workspace;
};

export const updateWorkspace = async (
  id: string,
  data: UpdateWorkspace,
  ownerUserId: string,
) => {
  const [workspace] = await db
    .update(workspaces)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workspaces.id, id), eq(workspaces.ownerUserId, ownerUserId)))
    .returning();

  return workspace;
};

export const deleteWorkspace = async (id: string, ownerUserId: string) => {
  const [workspace] = await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.ownerUserId, ownerUserId)))
    .returning();

  return workspace;
};

export const countWorkspacesByOwner = async (ownerUserId: string) => {
  const [result] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, ownerUserId));

  return result?.count ?? 0;
};