import prisma from "@/lib/prisma";
import { clerkUserPayload } from "@/types";

export const createUser = async (user: clerkUserPayload) => {
  const newUser = await prisma.user.create({ data: user });

  return newUser;
};

export const updateuser = async (clerkId: string, user: clerkUserPayload) => {
  const updatedUser = await prisma.user.update({
    data: user,
    where: { clerkId },
  });

  return updatedUser;
};

export const deleteUser = async (clerkId: string) => {
  const deletedUser = await prisma.user.delete({
    where: { clerkId },
  });

  return deletedUser;
};
