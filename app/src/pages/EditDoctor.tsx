import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EditPageTemplate from '@/components/common/EditPageTemplate';
import { doctorService } from '@/services/doctorService';
import { useToast } from '@/hooks/useToast';

const EditDoctor = () => {
  const { id } = useParams<{ id: string }>();
  const { showError } = useToast();
  const [doctor, setDoctor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      try {
        const data = await doctorService.getDoctorById(Number(id));
        setDoctor(data);
      } catch (err) {
        showError('Failed to load doctor data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleSave = async (data: any) => {
    if (!id) return;
    await doctorService.updateDoctor(Number(id), data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <EditPageTemplate
      title="Edit Doctor"
      type="doctor"
      initialData={doctor}
      onSave={handleSave}
    />
  );
};

export default EditDoctor;
