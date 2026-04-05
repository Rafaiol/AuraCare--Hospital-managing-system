import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, MoreVertical, Edit, Shield, CheckCircle, XCircle, Plus, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import api from '@/services/api';

interface UserData {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleName: string;
  status: string;
}

const SELECT_CLS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'USER'];

const emptyCreate = () => ({
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  roleId: 4, // default: RECEPTIONIST
});

const Users = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ── Edit dialog ────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleName: '',
    status: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // ── Create dialog ──────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate());
  const [createSaving, setCreateSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch {
      showError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Edit handlers ──────────────────────────────────────────────────
  const openEdit = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      roleName: user.roleName ?? '',
      status: user.status ?? 'ACTIVE',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setEditSaving(true);
    try {
      // Update personal info
      await api.put(`/auth/users/${selectedUser.userId}/info`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
      });
      // Update role / status
      await api.put(`/auth/users/${selectedUser.userId}`, {
        roleName: editForm.roleName,
        status: editForm.status,
      });
      showSuccess('User updated successfully');
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Create handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setCreateForm(emptyCreate());
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.email || !createForm.password) {
      showError('Username, email and password are required');
      return;
    }
    setCreateSaving(true);
    try {
      await api.post('/auth/register', createForm);
      showSuccess('User created successfully');
      setCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      showError(err?.response?.data?.message ?? 'Failed to create user');
    } finally {
      setCreateSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-red-100 text-red-800 border-red-200"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'DOCTOR': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Doctor</Badge>;
      case 'RECEPTIONIST': return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Receptionist</Badge>;
      case 'NURSE': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Nurse</Badge>;
      default: return <Badge variant="secondary">User</Badge>;
    }
  };

  const getStatusBadge = (status: string) =>
    status === 'ACTIVE'
      ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;

  const filteredUsers = users.filter(u =>
    (u.username ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.firstName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.lastName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">User Management</h1>
          <p className="text-gray-500">Manage application users and roles</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create User
          </Button>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.roleName)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-amber-600"
                            onClick={async () => {
                              try {
                                await api.put(`/auth/users/${user.userId}`, {
                                  status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                });
                                showSuccess(`User ${user.status === 'ACTIVE' ? 'deactivated' : 'activated'}`);
                                fetchUsers();
                              } catch {
                                showError('Failed to update status');
                              }
                            }}
                          >
                            {user.status === 'ACTIVE'
                              ? <><XCircle className="mr-2 h-4 w-4" />Deactivate</>
                              : <><CheckCircle className="mr-2 h-4 w-4" />Activate</>
                            }
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Edit User Dialog ─────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User — @{selectedUser?.username}</DialogTitle>
            <DialogDescription>Update personal info, role and status.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Personal info */}
            <div className="space-y-1">
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={editForm.firstName}
                onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={editForm.lastName}
                onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email address"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>

            {/* Role & Status */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <select
                className={SELECT_CLS}
                value={editForm.roleName}
                onChange={(e) => setEditForm(f => ({ ...f, roleName: e.target.value }))}
              >
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <select
                className={SELECT_CLS}
                value={editForm.status}
                onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleUpdate}
              disabled={editSaving}
            >
              {editSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create User Dialog ───────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Fill out the form to add a new system user.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-1 -mx-1">
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Username <span className="text-red-500">*</span></label>
                <Input
                  value={createForm.username}
                  onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="johndoe"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@hospital.com"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium">Password <span className="text-red-500">*</span></label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <select
                  className={SELECT_CLS}
                  value={createForm.roleId}
                  onChange={(e) => setCreateForm(f => ({ ...f, roleId: Number(e.target.value) }))}
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Doctor</option>
                  <option value={3}>Nurse</option>
                  <option value={4}>Receptionist</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={handleCreate}
              disabled={createSaving}
            >
              {createSaving ? 'Creating…' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
