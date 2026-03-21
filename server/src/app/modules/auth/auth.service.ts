    import prisma from "../../config/prisma";
import { utils } from "../../utils/utils";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import { LoginInput, RegisterInput } from "./auth.validate";

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");

  const isMatch = await utils.comparePassword(data.password, user.password);
  if (!isMatch) throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");

  const token = utils.generateToken({
    id: user.id, email: user.email, role: user.role, username: user.username,
  });

  return {
    token,
    user: { id: user.id, email: user.email, username: user.username, role: user.role, name: user.name },
  };
};

const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { username: data.username }] },
  });
  if (existing) throw new AppError(StatusCodes.CONFLICT, "Email or username already exists");

  const hashed = await utils.hashPassword(data.password);
  return prisma.user.create({
    data: { username: data.username, email: data.email, password: hashed, name: data.name, role: "ADMIN" },
    select: { id: true, email: true, username: true, role: true, name: true },
  });
};

export const authService = { login, register };