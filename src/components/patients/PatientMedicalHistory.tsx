import TreatmentsList from "@/components/treatments/TreatmentsList";

interface PatientMedicalHistoryProps {
  patientId: string;
}

const PatientMedicalHistory = ({ patientId }: PatientMedicalHistoryProps) => {
  return <TreatmentsList patientId={patientId} />;
};

export default PatientMedicalHistory;