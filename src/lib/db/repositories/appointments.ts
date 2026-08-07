import { readOrgCollection, writeOrgCollection, generateId } from "../store";
import type { Appointment } from "@/types";

const COLLECTION = "appointments";

export const appointmentsRepository = {
  findAll(organizationId: string): Appointment[] {
    return readOrgCollection<Appointment>(organizationId, COLLECTION).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  },

  findById(organizationId: string, id: string): Appointment | undefined {
    return readOrgCollection<Appointment>(organizationId, COLLECTION).find((a) => a.id === id);
  },

  findByClient(organizationId: string, clientId: string): Appointment[] {
    return this.findAll(organizationId).filter((a) => a.clientId === clientId);
  },

  findByDateRange(organizationId: string, startISO: string, endISO: string): Appointment[] {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return this.findAll(organizationId).filter((a) => {
      const t = new Date(a.startAt).getTime();
      return t >= start && t <= end;
    });
  },

  create(
    organizationId: string,
    data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ): Appointment {
    const all = readOrgCollection<Appointment>(organizationId, COLLECTION);
    const now = new Date().toISOString();
    const appointment: Appointment = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    all.push(appointment);
    writeOrgCollection(organizationId, COLLECTION, all);
    return appointment;
  },

  update(
    organizationId: string,
    id: string,
    data: Partial<Omit<Appointment, "id" | "createdAt">>
  ): Appointment | undefined {
    const all = readOrgCollection<Appointment>(organizationId, COLLECTION);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    writeOrgCollection(organizationId, COLLECTION, all);
    return all[idx];
  },

  delete(organizationId: string, id: string): boolean {
    const all = readOrgCollection<Appointment>(organizationId, COLLECTION);
    const next = all.filter((a) => a.id !== id);
    if (next.length === all.length) return false;
    writeOrgCollection(organizationId, COLLECTION, next);
    return true;
  },
};
