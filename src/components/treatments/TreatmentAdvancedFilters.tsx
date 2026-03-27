import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AdvancedTreatmentFilters } from "@/pages/dentalTreatmentsManagement.helpers";
import {
  DEFAULT_ADVANCED_FILTERS,
  countActiveFilters,
} from "@/pages/dentalTreatmentsManagement.helpers";

// ── Constants ───────────────────────────────────────────────────────

const FDI_GROUPS: { label: string; teeth: string[] }[] = [
  { label: "علوي أيمن (١)", teeth: ["18", "17", "16", "15", "14", "13", "12", "11"] },
  { label: "علوي أيسر (٢)", teeth: ["21", "22", "23", "24", "25", "26", "27", "28"] },
  { label: "سفلي أيسر (٣)", teeth: ["31", "32", "33", "34", "35", "36", "37", "38"] },
  { label: "سفلي أيمن (٤)", teeth: ["41", "42", "43", "44", "45", "46", "47", "48"] },
];

const STATUS_OPTIONS = [
  { value: "all", label: "جميع الحالات" },
  { value: "planned", label: "مخطط" },
  { value: "in_progress", label: "قيد التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const PERIOD_OPTIONS = [
  { value: "all", label: "جميع الفترات" },
  { value: "this_week", label: "هذا الأسبوع" },
  { value: "this_month", label: "هذا الشهر" },
  { value: "last_3_months", label: "آخر ٣ أشهر" },
  { value: "this_year", label: "هذا العام" },
];

const NUMBERING_OPTIONS = [
  { value: "all", label: "جميع الأنظمة" },
  { value: "fdi", label: "FDI (الدولي)" },
  { value: "universal", label: "Universal (الأمريكي)" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "الأحدث أولاً" },
  { value: "date_asc", label: "الأقدم أولاً" },
  { value: "name_asc", label: "اسم المريض أ ← ي" },
  { value: "name_desc", label: "اسم المريض ي ← أ" },
  { value: "status", label: "حسب الحالة" },
];

const HAS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "yes", label: "يحتوي" },
  { value: "no", label: "لا يحتوي" },
];

const STATUS_LABEL: Record<string, string> = {
  planned: "مخطط",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

// ── Component ────────────────────────────────────────────────────────

interface Props {
  filters: AdvancedTreatmentFilters;
  onChange: (filters: AdvancedTreatmentFilters) => void;
  clinicId?: string;
}

export function TreatmentAdvancedFilters({ filters, onChange, clinicId }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeCount = countActiveFilters(filters);

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-for-filter", clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, full_name")
        .eq("clinic_id", clinicId!)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!clinicId,
  });

  const set = <K extends keyof AdvancedTreatmentFilters>(
    key: K,
    value: AdvancedTreatmentFilters[K]
  ) => onChange({ ...filters, [key]: value });

  const resetAll = () => onChange(DEFAULT_ADVANCED_FILTERS);

  // ── Build active chips ──────────────────────────────────────────────
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.status !== "all")
    chips.push({
      label: `الحالة: ${STATUS_LABEL[filters.status] ?? filters.status}`,
      onRemove: () => set("status", "all"),
    });

  if (filters.doctorId !== "all") {
    const doc = doctors.find((d) => d.id === filters.doctorId);
    chips.push({
      label: `الطبيب: ${doc?.full_name ?? "..."}`,
      onRemove: () => set("doctorId", "all"),
    });
  }

  if (filters.period !== "all") {
    const opt = PERIOD_OPTIONS.find((o) => o.value === filters.period);
    chips.push({ label: opt?.label ?? filters.period, onRemove: () => set("period", "all") });
  }

  if (filters.toothNumber.trim())
    chips.push({
      label: `السن: ${filters.toothNumber}`,
      onRemove: () => set("toothNumber", ""),
    });

  if (filters.numberingSystem !== "all") {
    const opt = NUMBERING_OPTIONS.find((o) => o.value === filters.numberingSystem);
    chips.push({
      label: `نظام: ${opt?.label ?? filters.numberingSystem}`,
      onRemove: () => set("numberingSystem", "all"),
    });
  }

  if (filters.hasSurface !== "all")
    chips.push({
      label: `بيانات السطح: ${filters.hasSurface === "yes" ? "يحتوي" : "لا يحتوي"}`,
      onRemove: () => set("hasSurface", "all"),
    });

  if (filters.hasNotes !== "all")
    chips.push({
      label: `ملاحظات: ${filters.hasNotes === "yes" ? "يحتوي" : "لا يحتوي"}`,
      onRemove: () => set("hasNotes", "all"),
    });

  if (filters.dateFrom)
    chips.push({ label: `من: ${filters.dateFrom}`, onRemove: () => set("dateFrom", "") });

  if (filters.dateTo)
    chips.push({ label: `إلى: ${filters.dateTo}`, onRemove: () => set("dateTo", "") });

  if (filters.sortBy !== "date_desc") {
    const opt = SORT_OPTIONS.find((o) => o.value === filters.sortBy);
    chips.push({
      label: `ترتيب: ${opt?.label ?? filters.sortBy}`,
      onRemove: () => set("sortBy", "date_desc"),
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Row 1: search + toggle ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <Input
            placeholder="ابحث باسم المريض أو الطبيب أو التشخيص أو رقم السن..."
            value={filters.searchTerm}
            onChange={(e) => set("searchTerm", e.target.value)}
            className="pr-10"
          />
        </div>

        <Button
          variant={activeCount > 0 ? "default" : "outline"}
          className="gap-2 shrink-0"
          onClick={() => setPanelOpen((o) => !o)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          الفلاتر المتقدمة
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-[1.25rem] rounded-full px-1.5 text-xs leading-none"
            >
              {activeCount}
            </Badge>
          )}
          {panelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* ── Row 2: expandable filter panel ── */}
      {panelOpen && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-4">

              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  الحالة
                </Label>
                <Select value={filters.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Doctor */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  الطبيب المعالج
                </Label>
                <Select value={filters.doctorId} onValueChange={(v) => set("doctorId", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="جميع الأطباء" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأطباء</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  الفترة الزمنية
                </Label>
                <Select value={filters.period} onValueChange={(v) => set("period", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  الترتيب
                </Label>
                <Select value={filters.sortBy} onValueChange={(v) => set("sortBy", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date from */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  من تاريخ
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.dateFrom}
                  onChange={(e) => set("dateFrom", e.target.value)}
                />
              </div>

              {/* Date to */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  إلى تاريخ
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={filters.dateTo}
                  onChange={(e) => set("dateTo", e.target.value)}
                />
              </div>

              {/* Tooth number */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  رقم السن
                </Label>
                <Select
                  value={filters.toothNumber || "__all__"}
                  onValueChange={(v) => set("toothNumber", v === "__all__" ? "" : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="جميع الأسنان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">جميع الأسنان</SelectItem>
                    {FDI_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel className="text-xs">{group.label}</SelectLabel>
                        {group.teeth.map((t) => (
                          <SelectItem key={t} value={t}>
                            سن {t}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Numbering system */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  نظام الترقيم
                </Label>
                <Select
                  value={filters.numberingSystem}
                  onValueChange={(v) => set("numberingSystem", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBERING_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Has surface */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  بيانات السطح السريري
                </Label>
                <Select
                  value={filters.hasSurface}
                  onValueChange={(v) => set("hasSurface", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HAS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Has notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                  الملاحظات
                </Label>
                <Select
                  value={filters.hasNotes}
                  onValueChange={(v) => set("hasNotes", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HAS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeCount > 0 && (
              <>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={resetAll}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    مسح جميع الفلاتر
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Row 3: active filter chips ── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">فلاتر نشطة:</span>

          {chips.map((chip, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="gap-1 text-xs pr-1.5 pl-1"
            >
              {chip.label}
              <button
                className="rounded-sm hover:bg-muted/80 p-0.5 transition-colors"
                onClick={chip.onRemove}
                aria-label="إزالة الفلتر"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
            onClick={resetAll}
          >
            <RotateCcw className="w-3 h-3" />
            مسح الكل
          </Button>
        </div>
      )}
    </div>
  );
}
