import EditPageTemplate from '@/components/common/EditPageTemplate';
import { patientService } from '@/services/patientService';

const AddPatient = () => {
  const handleSave = async (data: any) => {
    // In a real app, we would use a create method
    // For now, let's use the layout's dynamic nature
    console.log('Adding patient:', data);
    await patientService.createPatient(data);
  };

  return (
    <EditPageTemplate
      title="Add New Patient"
      type="patient"
      onSave={handleSave}
    />
  );
};

export default AddPatient;
