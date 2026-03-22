import prisma from "../../config/prisma";
import { utils } from "../../utils/utils";
import AppError from "../../global/error";
import { StatusCodes } from "http-status-codes";
import {
  LoginInput, RegisterInput,
  ChangePasswordInput, ChangeEmailInput, ChangeUsernameInput,
} from "./auth.validate";

const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");

  const isMatch = await utils.comparePassword(data.password, user.password);
  if (!isMatch) throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid email or password");

  const token = utils.generateToken({
    id: user.id, email: user.email, role: user.role, username: user.username, name: user.name,
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

const getAdmins = async () => {
  return prisma.user.findMany({
    where:   { role: "ADMIN" },
    select:  { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
};

const deleteAdmin = async (id: string, requesterId: string) => {
  if (id === requesterId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot delete your own account");
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "Admin not found");

  return prisma.user.delete({ where: { id } });
};

// ── Change password — requires old password verification ──────────────────────
const changePassword = async (userId: string, data: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const isMatch = await utils.comparePassword(data.oldPassword, user.password);
  if (!isMatch) throw new AppError(StatusCodes.UNAUTHORIZED, "Current password is incorrect");

  const hashed = await utils.hashPassword(data.newPassword);
  return prisma.user.update({
    where:  { id: userId },
    data:   { password: hashed },
    select: { id: true, email: true, username: true },
  });
};

// ── Change email — no password required ──────────────────────────────────────
const changeEmail = async (userId: string, data: ChangeEmailInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== userId) {
    throw new AppError(StatusCodes.CONFLICT, "Email already in use");
  }

  return prisma.user.update({
    where:  { id: userId },
    data:   { email: data.email },
    select: { id: true, email: true, username: true },
  });
};

// ── Change username ───────────────────────────────────────────────────────────
const changeUsername = async (userId: string, data: ChangeUsernameInput) => {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing && existing.id !== userId) {
    throw new AppError(StatusCodes.CONFLICT, "Username already taken");
  }

  return prisma.user.update({
    where:  { id: userId },
    data:   { username: data.username },
    select: { id: true, email: true, username: true },
  });
};

export const authService = {
  login,
  register,
  getAdmins,
  deleteAdmin,
  changePassword,
  changeEmail,
  changeUsername,
};