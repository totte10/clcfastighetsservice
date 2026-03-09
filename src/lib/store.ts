// Supabase-based store
import { supabase } from "@/integrations/supabase/client";

export interface Area {
  id: string;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  blowStatus: "pending" | "in-progress" | "done";
  sweepStatus: "pending" | "in-progress" | "done";
  images: string[];
  notes: string;
}

export interface TimeEntry {
  id: string;
  employeeName: string;
  areaId?: string;
  type: "clock" | "manual";
  clockIn?: string;
  clockOut?: string;
  manualStart?: string;
  manualEnd?: string;
  date: string;
}

// --- Areas ---
export async function getAreas(): Promise<Area[]> {
  const { data, error } = await supabase.from("areas").select("*").order("created_at");
  if (error) { console.error("getAreas error:", error); return []; }
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    blowStatus: r.blow_status as Area["blowStatus"],
    sweepStatus: r.sweep_status as Area["sweepStatus"],
    images: r.images ?? [],
    notes: r.notes ?? "",
  }));
}

export async function addArea(area: Omit<Area, "id">): Promise<Area | null> {
  const { data, error } = await supabase.from("areas").insert({
    name: area.name,
    address: area.address,
    lat: area.lat,
    lng: area.lng,
    blow_status: area.blowStatus,
    sweep_status: area.sweepStatus,
    images: area.images,
    notes: area.notes,
  }).select().single();
  if (error) { console.error("addArea error:", error); return null; }
  return { id: data.id, name: data.name, address: data.address, lat: data.lat, lng: data.lng, blowStatus: data.blow_status as Area["blowStatus"], sweepStatus: data.sweep_status as Area["sweepStatus"], images: data.images ?? [], notes: data.notes ?? "" };
}

export async function updateArea(id: string, updates: Partial<Area>) {
  const mapped: Record<string, unknown> = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.address !== undefined) mapped.address = updates.address;
  if (updates.lat !== undefined) mapped.lat = updates.lat;
  if (updates.lng !== undefined) mapped.lng = updates.lng;
  if (updates.blowStatus !== undefined) mapped.blow_status = updates.blowStatus;
  if (updates.sweepStatus !== undefined) mapped.sweep_status = updates.sweepStatus;
  if (updates.images !== undefined) mapped.images = updates.images;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  await supabase.from("areas").update(mapped).eq("id", id);
}

export async function deleteArea(id: string) {
  await supabase.from("areas").delete().eq("id", id);
}

// --- Time entries ---
export async function getTimeEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from("time_entries").select("*").order("created_at", { ascending: false });
  if (error) { console.error("getTimeEntries error:", error); return []; }
  return (data ?? []).map((r) => ({
    id: r.id,
    employeeName: r.employee_name,
    areaId: r.area_id ?? undefined,
    type: r.type as TimeEntry["type"],
    clockIn: r.clock_in ?? undefined,
    clockOut: r.clock_out ?? undefined,
    manualStart: r.manual_start ?? undefined,
    manualEnd: r.manual_end ?? undefined,
    date: r.date,
  }));
}

export async function addTimeEntry(entry: Omit<TimeEntry, "id">) {
  await supabase.from("time_entries").insert({
    employee_name: entry.employeeName,
    area_id: entry.areaId,
    type: entry.type,
    clock_in: entry.clockIn,
    clock_out: entry.clockOut,
    manual_start: entry.manualStart,
    manual_end: entry.manualEnd,
    date: entry.date,
  });
}

// --- Active clock ---
export async function getActiveClock(): Promise<{ employeeName: string; clockIn: string } | null> {
  const { data } = await supabase.from("active_clocks").select("*").limit(1).maybeSingle();
  if (!data) return null;
  return { employeeName: data.employee_name, clockIn: data.clock_in };
}

export async function setActiveClock(clock: { employeeName: string; clockIn: string } | null) {
  // Clear all first
  await supabase.from("active_clocks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (clock) {
    await supabase.from("active_clocks").insert({
      employee_name: clock.employeeName,
      clock_in: clock.clockIn,
    });
  }
}

// --- Tidx entries ---
export interface TidxEntry {
  id: string;
  omrade: string;
  address: string;
  datumPlanerat: string;
  status: "pending" | "in-progress" | "done";
  ansvarig: string;
  kommentar: string;
  timmarMaskin: number;
  lat?: number | null;
  lng?: number | null;
  images: string[];
  projectNumber: string;
}

export async function getTidxEntries(): Promise<TidxEntry[]> {
  const { data, error } = await supabase.from("tidx_entries").select("*").order("created_at");
  if (error) { console.error("getTidxEntries error:", error); return []; }
  return (data ?? []).map((r) => ({
    id: r.id,
    omrade: r.omrade,
    address: r.address,
    datumPlanerat: r.datum_planerat,
    status: r.status as TidxEntry["status"],
    ansvarig: r.ansvarig,
    kommentar: r.kommentar,
    timmarMaskin: Number(r.timmar_maskin),
    lat: r.lat,
    lng: r.lng,
    images: r.images ?? [],
    projectNumber: r.project_number ?? "",
  }));
}

export async function updateTidxEntry(id: string, updates: Partial<TidxEntry>) {
  const mapped: Record<string, unknown> = {};
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.ansvarig !== undefined) mapped.ansvarig = updates.ansvarig;
  if (updates.kommentar !== undefined) mapped.kommentar = updates.kommentar;
  if (updates.lat !== undefined) mapped.lat = updates.lat;
  if (updates.lng !== undefined) mapped.lng = updates.lng;
  if (updates.images !== undefined) mapped.images = updates.images;
  if (updates.projectNumber !== undefined) mapped.project_number = updates.projectNumber;
  await supabase.from("tidx_entries").update(mapped).eq("id", id);
}

// --- Egna entries ---
export interface EgnaEntry {
  id: string;
  address: string;
  datumPlanerat: string;
  blowStatus: "pending" | "in-progress" | "done";
  sweepStatus: "pending" | "in-progress" | "done";
  ansvarig: string;
  kommentar: string;
  timmar: number;
  lat?: number | null;
  lng?: number | null;
  images: string[];
  projectNumber: string;
}

export async function getEgnaEntries(): Promise<EgnaEntry[]> {
  const { data, error } = await supabase.from("egna_entries").select("*").order("created_at");
  if (error) { console.error("getEgnaEntries error:", error); return []; }
  return (data ?? []).map((r) => ({
    id: r.id,
    address: r.address,
    datumPlanerat: r.datum_planerat,
    blowStatus: r.blow_status as EgnaEntry["blowStatus"],
    sweepStatus: r.sweep_status as EgnaEntry["sweepStatus"],
    ansvarig: r.ansvarig,
    kommentar: r.kommentar,
    timmar: Number(r.timmar),
    lat: r.lat,
    lng: r.lng,
    images: r.images ?? [],
  }));
}

export async function updateEgnaEntry(id: string, updates: Partial<EgnaEntry>) {
  const mapped: Record<string, unknown> = {};
  if (updates.blowStatus !== undefined) mapped.blow_status = updates.blowStatus;
  if (updates.sweepStatus !== undefined) mapped.sweep_status = updates.sweepStatus;
  if (updates.ansvarig !== undefined) mapped.ansvarig = updates.ansvarig;
  if (updates.kommentar !== undefined) mapped.kommentar = updates.kommentar;
  if (updates.lat !== undefined) mapped.lat = updates.lat;
  if (updates.lng !== undefined) mapped.lng = updates.lng;
  if (updates.images !== undefined) mapped.images = updates.images;
  await supabase.from("egna_entries").update(mapped).eq("id", id);
}
