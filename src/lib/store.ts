// Simple localStorage-based store for V1

export interface Area {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  blowStatus: "pending" | "in-progress" | "done";
  sweepStatus: "pending" | "in-progress" | "done";
  images: string[]; // base64 data URLs
  notes: string;
}

export interface TimeEntry {
  id: string;
  employeeName: string;
  areaId?: string;
  type: "clock" | "manual";
  clockIn?: string; // ISO date
  clockOut?: string;
  manualStart?: string;
  manualEnd?: string;
  date: string;
}

const AREAS_KEY = "snowapp_areas";
const TIME_KEY = "snowapp_time";
const CLOCK_KEY = "snowapp_active_clock";

export function getAreas(): Area[] {
  const data = localStorage.getItem(AREAS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAreas(areas: Area[]) {
  localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
}

export function addArea(area: Omit<Area, "id">): Area {
  const areas = getAreas();
  const newArea: Area = { ...area, id: crypto.randomUUID() };
  areas.push(newArea);
  saveAreas(areas);
  return newArea;
}

export function updateArea(id: string, updates: Partial<Area>) {
  const areas = getAreas();
  const idx = areas.findIndex((a) => a.id === id);
  if (idx !== -1) {
    areas[idx] = { ...areas[idx], ...updates };
    saveAreas(areas);
  }
}

export function deleteArea(id: string) {
  saveAreas(getAreas().filter((a) => a.id !== id));
}

export function getTimeEntries(): TimeEntry[] {
  const data = localStorage.getItem(TIME_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTimeEntries(entries: TimeEntry[]) {
  localStorage.setItem(TIME_KEY, JSON.stringify(entries));
}

export function addTimeEntry(entry: Omit<TimeEntry, "id">): TimeEntry {
  const entries = getTimeEntries();
  const newEntry: TimeEntry = { ...entry, id: crypto.randomUUID() };
  entries.push(newEntry);
  saveTimeEntries(entries);
  return newEntry;
}

export function getActiveClock(): { employeeName: string; clockIn: string } | null {
  const data = localStorage.getItem(CLOCK_KEY);
  return data ? JSON.parse(data) : null;
}

export function setActiveClock(clock: { employeeName: string; clockIn: string } | null) {
  if (clock) {
    localStorage.setItem(CLOCK_KEY, JSON.stringify(clock));
  } else {
    localStorage.removeItem(CLOCK_KEY);
  }
}
