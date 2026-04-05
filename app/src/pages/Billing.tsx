import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type RootState } from '@/store';
import { motion } from 'framer-motion';
import { billingService } from '@/services/billingService';
import { useToast } from '@/hooks/useToast';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, FileText, DollarSign, Download } from 'lucide-react';
import type { Invoice } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';

const Billing = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const result = await billingService.getInvoices({
        page: pagination.page,
        limit: 10,
      });
      setInvoices(result.invoices);
      setPagination(result.pagination);
    } catch (_error) {
      showError('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PAID: 'default',
      PENDING: 'secondary',
      PARTIAL: 'outline',
      OVERDUE: 'destructive',
      CANCELLED: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
    },
    {
      accessorKey: 'patient.name',
      header: 'Patient',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.patient.name}</p>
          <p className="text-sm text-gray-500">{row.original.patient.patientCode}</p>
        </div>
      ),
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue Date',
      cell: ({ row }) => new Date(row.original.issueDate).toLocaleDateString(),
    },
    {
      accessorKey: 'amounts.total',
      header: 'Total Amount',
      cell: ({ row }) => formatCurrency(row.original.amounts.total),
    },
    {
      accessorKey: 'amounts.paid',
      header: 'Paid',
      cell: ({ row }) => formatCurrency(row.original.amounts.paid),
    },
    {
      accessorKey: 'amounts.balance',
      header: 'Balance',
      cell: ({ row }) => (
        <span className={row.original.amounts.balance > 0 ? 'text-red-600' : 'text-green-600'}>
          {formatCurrency(row.original.amounts.balance)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedInvoice(row.original);
                setInvoiceDialogOpen(true);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DollarSign className="w-4 h-4 mr-2" />
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h1>
          <p className="text-gray-500">Manage invoices and payments</p>
        </div>
        {['ADMIN', 'RECEPTIONIST'].includes(user?.role?.roleName || '') && (
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white"
            onClick={() => {
              navigate('/billing/new');
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Revenue (This Month)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$45,250</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold text-red-600">$12,340</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Overdue Invoices</p>
          <p className="text-2xl font-bold text-orange-600">8</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <DataTable
          columns={columns}
          data={invoices}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Invoice Details Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-medium">{selectedInvoice.patient.name}</p>
                <p className="text-sm text-gray-500">{selectedInvoice.patient.patientCode}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.amounts.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedInvoice.amounts.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.amounts.total)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
              Close
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
