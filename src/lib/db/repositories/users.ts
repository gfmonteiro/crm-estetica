import { readCollection, writeCollection, generateId } from "../store";
import type { User } from "@/types";

const COLLECTION = "users";

export const usersRepository = {
  findAll(): User[] {
    return readCollection<User>(COLLECTION);
  },

  findByEmail(email: string): User | undefined {
    return readCollection<User>(COLLECTION).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  findById(id: string): User | undefined {
    return readCollection<User>(COLLECTION).find((u) => u.id === id);
  },

  findByOrganization(organizationId: string): User[] {
    return readCollection<User>(COLLECTION).filter((u) => u.organizationId === organizationId);
  },

  create(data: Omit<User, "id" | "createdAt">): User {
    const all = readCollection<User>(COLLECTION);
    const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    all.push(user);
    writeCollection(COLLECTION, all);
    return user;
  },
};
