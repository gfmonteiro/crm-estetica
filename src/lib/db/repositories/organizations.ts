import { readCollection, writeCollection, generateId, deleteOrgData } from "../store";
import type { Organization } from "@/types";

const COLLECTION = "organizations";

export const organizationsRepository = {
  findAll(): Organization[] {
    return readCollection<Organization>(COLLECTION).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findById(id: string): Organization | undefined {
    return readCollection<Organization>(COLLECTION).find((o) => o.id === id);
  },

  create(data: Omit<Organization, "id" | "createdAt" | "updatedAt">): Organization {
    const all = readCollection<Organization>(COLLECTION);
    const now = new Date().toISOString();
    const org: Organization = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    all.push(org);
    writeCollection(COLLECTION, all);
    return org;
  },

  update(id: string, data: Partial<Omit<Organization, "id" | "createdAt">>): Organization | undefined {
    const all = readCollection<Organization>(COLLECTION);
    const idx = all.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeCollection(COLLECTION, all);
    return all[idx];
  },

  // Remove a organização E todos os dados isolados dela (clientes, agenda...).
  // Irreversível — use com cuidado (a UI confirma antes de chamar).
  delete(id: string): boolean {
    const all = readCollection<Organization>(COLLECTION);
    const next = all.filter((o) => o.id !== id);
    if (next.length === all.length) return false;
    writeCollection(COLLECTION, next);
    deleteOrgData(id);
    return true;
  },
};
