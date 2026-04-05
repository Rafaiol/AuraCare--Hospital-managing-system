import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

const BillingForm = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: '',
    notes: '',
  });

  const [items, setItems] = useState<{ itemType: string, description: string, quantity: number, unitPrice: number }[]>([
    { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients', { params: { limit: 100 } });
        setPatients(response.data.data);
      } catch {
        console.error('Failed to load patients for billing form');
      }
    };
    fetchPatients();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { itemType: 'OTHER', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      showError('Please select a patient');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/billing/invoices', {
        patientId: Number(formData.patientId),
        dueDate: formData.dueDate,
        notes: formData.notes,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        }))
      });
      showSuccess('Invoice created successfully');
      navigate('/billing');
    } catch (error) {
      showError('Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-premium mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger id="patientId">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.patientId} value={p.patientId.toString()}>
                        {p.fullName} ({p.patientCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-full md:w-1/4 space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={item.itemType}
                    onValueChange={(value) => handleItemChange(index, 'itemType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="PROCEDURE">Procedure</SelectItem>
                      <SelectItem value="MEDICATION">Medication</SelectItem>
                      <SelectItem value="ROOM_CHARGE">Room Charge</SelectItem>
                      <SelectItem value="LAB_TEST">Lab Test</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/3 space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    required
                  />
                </div>
                <div className="w-full md:w-1/6 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="w-full md:w-1/6 space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}

            <div className="flex justify-end pt-4 font-bold text-xl text-gray-900 dark:text-white">
              Total: ${totalAmount.toFixed(2)}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t p-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Invoice'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default BillingForm;
