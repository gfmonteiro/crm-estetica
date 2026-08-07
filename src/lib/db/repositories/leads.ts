import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { Lead, LeadActivity } from "@/types";

const COLLECTION = "leads";
const ACTIVITY_COLLECTION = "lead_activities";

export const leadsRepository = {
  findAll(organizationId: string): Lead[] {
    return readOrgCollection<Lead>(organizationId, COLLECTION).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findById(organizationId: string, id: string): Lead | undefined {
    return readOrgCollection<Lead>(organizationId, COLLECTION).find((l) => l.id === id);
  },

  create(organizationId: string, data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead {
    const all = readOrgCollection<Lead>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const lead: Lead = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    all.push(lead);
    writeOrgCollection(organizationId, COLLECTION, all);
    return lead;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Lead, "id" | "createdAt">>
  ): Lead | undefined {
    const all = readOrgCollection<Lead>(organizationId, COLLECTION);
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<Lead>(organizationId, COLLECTION);
    const next = all.filter((l) => l.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};

export const leadActivitiesRepository = {
  findByLead(organizationId: string, leadId: string): LeadActivity[] {
    return readOrgCollection<LeadActivity>(organizationId, ACTIVITY_COLLECTION)
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  add(organizationId: string, leadId: string, descricao: string): LeadActivity {
    const all = readOrgCollection<LeadActivity>(organizationId, ACTIVITY_COLLECTION);
    const activity: LeadActivity = {
      id: generateId(),
      leadId,
      descricao,
      createdAt: new Date().toISOString(),
    };
    all.push(activity);
    writeOrgCollection(organizationId, ACTIVITY_COLLECTION, all);
    return activity;
  },
};
