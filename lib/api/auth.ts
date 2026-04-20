import { api } from "./client";

type AuthCredentials = {
  email: string;
  password: string;
};

export const signup = async (data: AuthCredentials) => {
  const response = await api.post("/signup", data);
  return response.data;
};

export const login = async (data: AuthCredentials) => {
  const response = await api.post("/login", data);
  return response.data;
};