import type { Treatment } from "@/services/treatmentService";

// ─────────────────────────────────────────────
// Advanced filter types
// ─────────────────────────────────────────────

export interface AdvancedTreatmentFilters {
  searchTerm: string;
  status: string;
  doctorId: string;
  dateFrom: string;
  dateTo: string;
  toothNumber: string;
  numberingSystem: string;
  hasSurface: string;
  hasNotes: string;
  sortBy: string;
  period: string;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedTreatmentFilters = {
  searchTerm: "",
  status: "all",
  doctorId: "all",
  dateFrom: "",
  dateTo: "",
  toothNumber: "",
  numberingSystem: "all",
  hasSurface: "all",
  hasNotes: "all",
  sortBy: "date_desc",
  period: "all",
};

/** Returns the number of non-default active filters (excludes sort). */
export function countActiveFilters(filters: AdvancedTreatmentFilters): number {
  let count = 0;
  if (filters.searchTerm.trim()) count++;
  if (filters.status !== "all") count++;
  if (filters.doctorId !== "all") count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  if (filters.toothNumber.trim()) count++;
  if (filters.numberingSystem !== "all") count++;
  if (filters.hasSurface !== "all") count++;
  if (filters.hasNotes !== "all") count++;
  if (filters.period !== "all") count++;
  return count;
}

const STATUS_PRIORITY: Record<string, number> = {
  in_progress: 0,
  planned: 1,
  completed: 2,
  cancelled: 3,
};

/** Full client-side advanced filter + sort pipeline. */
export function applyAdvancedFilters(
  treatments: Treatment[],
  filters: AdvancedTreatmentFilters
): Treatment[] {
  let result: Treatment[] = [...treatments];

  // ── Free text search ──────────────────────────────────────────────
  const term = filters.searchTerm.trim().toLowerCase();
  if (term) {
    result = result.filter(
      (t) =>
        t.patient?.full_name?.toLowerCase().includes(term) ||
        t.doctor?.full_name?.toLowerCase().includes(term) ||
        t.diagnosis?.toLowerCase().includes(term) ||
        t.treatment_plan?.toLowerCase().includes(term) ||
        t.tooth_number?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term)
    );
  }

  // ── Status ────────────────────────────────────────────────────────
  if (filters.status !== "all") {
    result = result.filter((t) => t.status === filters.status);
  }

  // ── Doctor ────────────────────────────────────────────────────────
  if (filters.doctorId !== "all") {
    result = result.filter((t) => t.assigned_doctor_id === filters.doctorId);
  }

  // ── Tooth number ──────────────────────────────────────────────────
  if (filters.toothNumber.trim()) {
    result = result.filter((t) => t.tooth_number === filters.toothNumber.trim());
  }

  // ── Numbering system ──────────────────────────────────────────────
  if (filters.numberingSystem !== "all") {
    result = result.filter(
      (t) => (t.numbering_system || "fdi").toLowerCase() === filters.numberingSystem
    );
  }

  // ── Has surface clinical data ─────────────────────────────────────
  if (filters.hasSurface === "yes") {
    result = result.filter((t) => !!t.tooth_surface);
  } else if (filters.hasSurface === "no") {
    result = result.filter((t) => !t.tooth_surface);
  }

  // ── Has notes ─────────────────────────────────────────────────────
  if (filters.hasNotes === "yes") {
    result = result.filter((t) => !!t.notes?.trim());
  } else if (filters.hasNotes === "no") {
    result = result.filter((t) => !t.notes?.trim());
  }

  // ── Relative period ───────────────────────────────────────────────
  if (filters.period !== "all") {
    const now = new Date();
    let from: Date | null = null;
    if (filters.period === "this_week") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    } else if (filters.period === "this_month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filters.period === "last_3_months") {
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (filters.period === "this_year") {
      from = new Date(now.getFullYear(), 0, 1);
    }
    if (from) {
      result = result.filter((t) => new Date(t.treatment_date) >= from!);
    }
  }

  // ── Explicit date range (takes precedence over / combines with period) ─
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    result = result.filter((t) => new Date(t.treatment_date) >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((t) => new Date(t.treatment_date) <= to);
  }

  // ── Sort ──────────────────────────────────────────────────────────
  result.sort((a, b) => {
    switch (filters.sortBy) {
      case "date_asc":
        return new Date(a.treatment_date).getTime() - new Date(b.treatment_date).getTime();
      case "name_asc":
        return (a.patient?.full_name ?? "").localeCompare(b.patient?.full_name ?? "", "ar");
      case "name_desc":
        return (b.patient?.full_name ?? "").localeCompare(a.patient?.full_name ?? "", "ar");
      case "status":
        return (
          (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
        );
      default: // date_desc
        return new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime();
    }
  });

  return result;
}

// ─────────────────────────────────────────────
// Legacy single-search helper (kept for tests)
// ─────────────────────────────────────────────

export function filterTreatmentsBySearch(treatments: Treatment[], searchTerm: string) {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return treatments;

  return treatments.filter((treatment) => {
    return (
      treatment.patient?.full_name?.toLowerCase().includes(normalized) ||
      treatment.doctor?.full_name?.toLowerCase().includes(normalized) ||
      treatment.diagnosis?.toLowerCase().includes(normalized) ||
      treatment.treatment_plan?.toLowerCase().includes(normalized) ||
      treatment.tooth_number?.toLowerCase().includes(normalized) ||
      treatment.notes?.toLowerCase().includes(normalized)
    );
  });
}

export function buildTreatmentStats(treatments: Treatment[]) {
  return {
    total: treatments.length,
    active: treatments.filter((treatment) => treatment.status === "in_progress" || treatment.status === "planned").length,
    completed: treatments.filter((treatment) => treatment.status === "completed").length,
    uniquePatients: new Set(treatments.map((treatment) => treatment.patient_id)).size,
  };
}

export function resolveTreatmentPageMeta(patientName?: string | null, doctorName?: string | null) {
  if (patientName) {
    return {
      title: `علاجات المريض ${patientName}`,
      description: "إدارة ومتابعة جميع العلاجات الخاصة بهذا المريض مع الربط بالفوترة والسجلات",
    };
  }

  if (doctorName) {
    return {
      title: `علاجات الطبيب ${doctorName}`,
      description: "عرض ومتابعة علاجات الطبيب المحدد مع التحكم التشغيلي المباشر",
    };
  }

  return {
    title: "العلاجات السنية",
    description: "إدارة شاملة للعلاجات السنية مع الربط بالسجل الطبي والفاتورة والمتابعة",
  };
}
