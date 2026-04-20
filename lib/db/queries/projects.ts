import { and, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { projects } from "../schema";

type CreateProject = InferInsertModel<typeof projects>;
type UpdateProject = Partial<Pick<CreateProject, "name" | "description">>;

export const createProject = async (data: CreateProject) => {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
};

export const getProjectsByUser = async (userId: string) => {
  return await db.select().from(projects).where(eq(projects.userId, userId));
};

export const getProjectByUser = async (id: string, userId: string) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

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

export const deleteProject = async (id: string, userId: string) => {
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  return project;
};
