import { db } from "../db";
import { users } from "../db/schema";

export const getUsers = async () => {
  try {
    const allUsers = await db.select().from(users);
    return { users: allUsers };
  } catch (error) {
    throw new Error(error);
  }
};
