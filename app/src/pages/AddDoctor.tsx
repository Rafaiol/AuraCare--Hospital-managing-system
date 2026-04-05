import EditPageTemplate from '@/components/common/EditPageTemplate';
import { doctorService } from '@/services/doctorService';

const AddDoctor = () => {
  const handleSave = async (data: any) => {
    console.log('Adding doctor:', data);
    await doctorService.createDoctor(data);
  };

  return (
    <EditPageTemplate
      title="Add New Doctor"
      type="doctor"
      onSave={handleSave}
    />
  );
};

export default AddDoctor;
