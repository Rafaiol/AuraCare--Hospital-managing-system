import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Trash2, Edit2, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

interface Department {
  departmentId: number;
  name: string;
  description?: string;
  doctorCount?: number;
}

const Departments = () => {
  const { showSuccess, showError } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(res.data.data ?? res.data);
    } catch {
      showError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingDept(null);
    setFormName('');
    setFormDesc('');
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDesc(dept.description ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.departmentId}`, { name: formName, description: formDesc });
        showSuccess('Department updated');
      } else {
        await api.post('/departments', { name: formName, description: formDesc });
        showSuccess('Department created');
      }
      setDialogOpen(false);
      fetchDepartments();
    } catch {
      showError('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Delete "${dept.name}"?`)) return;
    try {
      await api.delete(`/departments/${dept.departmentId}`);
      showSuccess('Department deleted');
      fetchDepartments();
    } catch {
      showError('Failed to delete department');
    }
  };

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Departments</h1>
          <p className="text-gray-500">Manage hospital departments</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search departments…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept, i) => (
            <motion.div
              key={dept.departmentId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white">{dept.name}</h3>
              {dept.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
              )}
              {dept.doctorCount !== undefined && (
                <div className="mt-3">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                    <Users className="w-3 h-3" /> {dept.doctorCount} doctors
                  </Badge>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'New Department'}</DialogTitle>
            <DialogDescription className="hidden">Manage department details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="e.g. Cardiology"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description…"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleSave}
              disabled={saving || !formName.trim()}
            >
              {saving ? 'Saving…' : editingDept ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Departments;
