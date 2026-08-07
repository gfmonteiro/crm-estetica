import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { AutomationRule } from "@/types";

const COLLECTION = "automation_rules";

export const automationRulesRepository = {
  findAll(organizationId: string): AutomationRule[] {
    return readOrgCollection<AutomationRule>(organizationId, COLLECTION).sort(
      (a, b) => a.diasAposAtendimento - b.diasAposAtendimento
    );
  },

  findActive(organizationId: string): AutomationRule[] {
    return this.findAll(organizationId).filter((r) => r.ativo);
  },

  findById(organizationId: string, id: string): AutomationRule | undefined {
    return readOrgCollection<AutomationRule>(organizationId, COLLECTION).find((r) => r.id === id);
  },

  create(
    organizationId: string,
    data: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">
  ): AutomationRule {
    const all = readOrgCollection<AutomationRule>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const rule: AutomationRule = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    all.push(rule);
    writeOrgCollection(organizationId, COLLECTION, all);
    return rule;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<AutomationRule, "id" | "createdAt">>
  ): AutomationRule | undefined {
    const all = readOrgCollection<AutomationRule>(organizationId, COLLECTION);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<AutomationRule>(organizationId, COLLECTION);
    const next = all.filter((r) => r.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};
