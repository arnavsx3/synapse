import { and, desc, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projects } from "../schema";

type CreateProject = InferInsertModel<typeof projects>;
type UpdateProject = Partial<Pick<CreateProject, "name" | "description">>;

export const createProject = async (data: CreateProject) => {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
};

export const getProjectsByUser = async (userId: string) => {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
};

export const getProjectsByWorkspace = async (
  userId: string,
  workspaceId: string,
) => {
  return await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.userId, userId), eq(projects.workspaceId, workspaceId)),
    )
    .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
};

export const getProjectByUser = async (id: string, userId: string) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  return project;
};

export const getProjectByWorkspace = async (
  id: string,
  userId: string,
  workspaceId: string,
) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.userId, userId),
        eq(projects.workspaceId, workspaceId),
      ),
    );

  return project;
};

export const updateProject = async (
  id: string,
  data: UpdateProject,
  userId: string,
) => {
  const [project] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  return project;
};

export const updateProjectInWorkspace = async (
  id: string,
  data: UpdateProject,
  userId: string,
  workspaceId: string,
) => {
  const [project] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(projects.id, id),
        eq(projects.userId, userId),
        eq(projects.workspaceId, workspaceId),
      ),
    )
    .returning();

  return project;
};

export const deleteProject = async (id: string, userId: string) => {
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  return project;
};

export const deleteProjectInWorkspace = async (
  id: string,
  userId: string,
  workspaceId: string,
) => {
  const [project] = await db
    .delete(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.userId, userId),
        eq(projects.workspaceId, workspaceId),
      ),
    )
    .returning();

  return project;
};
