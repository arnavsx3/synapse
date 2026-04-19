import { api } from "./client";

export const signup = async (data: { email: string; password: string }) => {
  const response = await api.post("/signup", data);
  return response.data;
};

