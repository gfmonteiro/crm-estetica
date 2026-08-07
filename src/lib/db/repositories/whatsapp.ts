import {
  readOrgObject,
  writeOrgObject,
  readOrgCollection,
  writeOrgCollection,
  generateId,
} from "../store";
import type { WhatsAppSettings, WhatsAppLogEntry } from "@/types";

const SETTINGS_KEY = "whatsapp_settings";
const LOG_COLLECTION = "whatsapp_log";

export const whatsappSettingsRepository = {
  get(organizationId: string): WhatsAppSettings | null {
    return readOrgObject<WhatsAppSettings>(organizationId, SETTINGS_KEY);
  },

  save(organizationId: string, data: Omit<WhatsAppSettings, "updatedAt">): WhatsAppSettings {
    const settings: WhatsAppSettings = { ...data, updatedAt: new Date().toISOString() };
    writeOrgObject(organizationId, SETTINGS_KEY, settings);
    return settings;
  },
};

export const whatsappLogRepository = {
  findAll(organizationId: string): WhatsAppLogEntry[] {
    return readOrgCollection<WhatsAppLogEntry>(organizationId, LOG_COLLECTION).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  add(organizationId: string, entry: Omit<WhatsAppLogEntry, "id" | "createdAt">): WhatsAppLogEntry {
    const all = readOrgCollection<WhatsAppLogEntry>(organizationId, LOG_COLLECTION);
    const full: WhatsAppLogEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    all.unshift(full);
    writeOrgCollection(organizationId, LOG_COLLECTION, all.slice(0, 200));
    return full;
  },
};
