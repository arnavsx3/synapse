import z from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const deleteProjectSchema = z.object({
  id: z.string().uuid(),
});
