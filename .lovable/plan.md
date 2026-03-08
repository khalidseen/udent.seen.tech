

## Audit Results: Doctors, Assistants, Secretaries -- Integration Gaps

### Current State

**What works:**
- All three pages (Doctors, Assistants, Secretaries) have CRUD operations with `clinic_id` isolation
- `dental_treatments` table has `assigned_doctor_id` FK to `doctors` table
- `DentalTreatmentsManagement` already joins `doctors(full_name)`

**Critical gaps identified:**

1. **Appointments have NO doctor assignment** -- The `appointments` table lacks a `doctor_id` column. In a real dental clinic, every appointment must be assigned to a specific doctor. This is the biggest missing link.

2. **Prescriptions use free-text `doctor_name`** -- Instead of linking to the `doctors` table via FK, prescriptions store a manually typed doctor name. This breaks data integrity.

3. **Assistants are not linked to doctors** -- `doctor_assistants` table has no `doctor_id` FK. In practice, assistants are assigned to specific doctors.

4. **Secretaries have no functional role** -- Secretaries exist as a standalone list with no connection to appointments, patients, or any workflow.

5. **Doctor cards have no navigation links** -- No links to view a doctor's appointments, treatments, or patients.

6. **AddDoctorDialog doesn't reset on edit** -- Form state initializes once but doesn't update when `editingDoctor` prop changes.

---

### Implementation Plan

#### Phase 1: Database Migration
Add `doctor_id` column to `appointments` table:
```sql
ALTER TABLE appointments ADD COLUMN doctor_id UUID REFERENCES doctors(id);
```

#### Phase 2: Doctors Page Enhancement
- Add action buttons per doctor card: "View Appointments", "View Treatments", "View Patients"
- Show live stats per doctor: appointment count today, total patients treated, total treatments
- Fix `AddDoctorDialog` to properly sync form state when editing different doctors
- Add navigation to `/appointments?doctor=ID` and `/dental-treatments-management?doctor=ID`

#### Phase 3: Link Doctors to Appointments
- Update `NewAppointmentForm`: Add doctor selection dropdown (Step 2 - Schedule) populated from `doctors` table filtered by `clinic_id` and `status=active`
- Update `AddAppointmentPopup`: Add doctor select field
- Update `EditAppointmentDialog`: Add doctor select field
- Update `AppointmentList`: Show assigned doctor name (join `doctors` table)
- Update `CalendarView`: Include doctor name in appointment display
- Update `DayDetailModal`: Show doctor info

#### Phase 4: Link Doctors to Prescriptions
- Update `CreatePrescriptionDialog`: Replace free-text `doctor_name` input with a dropdown that selects from `doctors` table, auto-filling `doctor_name` and `doctor_license`
- Update `PatientPrescriptionSection`: Same doctor dropdown integration

#### Phase 5: Link Assistants to Doctors
- Update `DoctorAssistants` page: Add a "Doctor" select field in the create/edit form to assign each assistant to a doctor
- Display assigned doctor name in the assistants table
- Add navigation from assistant row to their doctor's profile

#### Phase 6: Secretaries Integration
- Add "Assigned Tasks" concept: link secretaries to appointment management workflow
- Add quick action buttons: "Book Appointment" (navigates to `/appointments/new`), "View Today's Schedule" (navigates to `/appointments`)
- Show secretary activity stats (if appointment_requests tracks who processed them)

#### Phase 7: Cross-Module Navigation
- From Doctor card -> View their appointments, treatments, patients, prescriptions
- From Appointment -> Navigate to assigned doctor
- From Treatment -> Navigate to assigned doctor
- From Assistant -> Navigate to assigned doctor

---

### Technical Details

**Files to create:**
- None (all changes in existing files)

**Files to modify:**
- `src/pages/Doctors.tsx` -- Add per-doctor stats and navigation links
- `src/components/doctors/AddDoctorDialog.tsx` -- Fix form state sync
- `src/components/appointments/NewAppointmentForm.tsx` -- Add doctor selection
- `src/components/appointments/AddAppointmentPopup.tsx` -- Add doctor selection
- `src/components/appointments/EditAppointmentDialog.tsx` -- Add doctor selection
- `src/components/appointments/AppointmentList.tsx` -- Show doctor name
- `src/components/appointments/CalendarView.tsx` -- Show doctor in events
- `src/components/prescriptions/CreatePrescriptionDialog.tsx` -- Doctor dropdown
- `src/components/patients/PatientPrescriptionSection.tsx` -- Doctor dropdown
- `src/pages/DoctorAssistants.tsx` -- Add doctor assignment
- `src/pages/Secretaries.tsx` -- Add workflow navigation

**Database migration:**
- Add `doctor_id` UUID column to `appointments` table with FK to `doctors(id)`

