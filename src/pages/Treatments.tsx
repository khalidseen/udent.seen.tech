import { useLocation } from "react-router-dom";
import DentalTreatmentForm from "@/components/dental/DentalTreatmentForm";

const Treatments = () => {
  const location = useLocation();
  const patientId = location.state?.patientId;

  return <DentalTreatmentForm patientId={patientId} />;
};

export default Treatments;