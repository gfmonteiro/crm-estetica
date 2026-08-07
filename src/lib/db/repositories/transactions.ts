import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { Transaction } from "@/types";

const COLLECTION = "transactions";

export const transactionsRepository = {
  findAll(organizationId: string): Transaction[] {
    return readOrgCollection<Transaction>(organizationId, COLLECTION).sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  },

  findById(organizationId: string, id: string): Transaction | undefined {
    return readOrgCollection<Transaction>(organizationId, COLLECTION).find((t) => t.id === id);
  },

  findByClient(organizationId: string, clientId: string): Transaction[] {
    return this.findAll(organizationId).filter((t) => t.clientId === clientId);
  },

  create(organizationId: string, data: Omit<Transaction, "id" | "createdAt">): Transaction {
    const all = readOrgCollection<Transaction>(organizationId, COLLECTION);
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    all.push(transaction);
    writeOrgCollection(organizationId, COLLECTION, all);
    return transaction;
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<Transaction>(organizationId, COLLECTION);
    const next = all.filter((t) => t.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};
