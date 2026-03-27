import { describe, expect, it } from "vitest";
import { buildTreatmentStats, filterTreatmentsBySearch, resolveTreatmentPageMeta } from "@/pages/dentalTreatmentsManagement.helpers";
import type { Treatment } from "@/services/treatmentService";

const treatments: Treatment[] = [
  {
    id: "1",
    clinic_id: "c1",
    patient_id: "p1",
    assigned_doctor_id: "d1",
    tooth_number: "11",
    treatment_plan: "حشو تجميلي",
    diagnosis: "تسوس أمامي",
    status: "planned",
    notes: "يحتاج متابعة",
    treatment_date: "2026-03-27",
    created_at: "2026-03-27",
    patient: { id: "p1", full_name: "خالد أحمد", phone: "050" },
    doctor: { id: "d1", full_name: "د. سامي" },
  },
  {
    id: "2",
    clinic_id: "c1",
    patient_id: "p2",
    assigned_doctor_id: "d2",
    tooth_number: "26",
    treatment_plan: "علاج عصب",
    diagnosis: "التهاب عصب",
    status: "completed",
    notes: null,
    treatment_date: "2026-03-20",
    created_at: "2026-03-20",
    patient: { id: "p2", full_name: "محمد علي", phone: null },
    doctor: { id: "d2", full_name: "د. ندى" },
  },
];

describe("dentalTreatmentsManagement helpers", () => {
  it("filters treatments by patient, doctor, diagnosis and tooth number", () => {
    expect(filterTreatmentsBySearch(treatments, "خالد")).toHaveLength(1);
    expect(filterTreatmentsBySearch(treatments, "ندى")).toHaveLength(1);
    expect(filterTreatmentsBySearch(treatments, "عصب")).toHaveLength(1);
    expect(filterTreatmentsBySearch(treatments, "26")).toHaveLength(1);
  });

  it("builds aggregate stats correctly", () => {
    expect(buildTreatmentStats(treatments)).toEqual({
      total: 2,
      active: 1,
      completed: 1,
      uniquePatients: 2,
    });
  });

  it("resolves contextual page metadata", () => {
    expect(resolveTreatmentPageMeta("خالد أحمد", null).title).toContain("خالد أحمد");
    expect(resolveTreatmentPageMeta(null, "د. سامي").title).toContain("د. سامي");
    expect(resolveTreatmentPageMeta(null, null).title).toBe("العلاجات السنية");
  });
});
