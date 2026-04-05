import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationService, type Notification } from '@/services/notificationService';
import { useToast } from '@/hooks/useToast';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Check,
  Filter,
  RefreshCcw,
  MailOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Notifications = () => {
  const { showError, showSuccess } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { notifications: data } = await notificationService.getNotifications({
        unreadOnly: filter === 'unread',
        limit: 50
      });
      setNotifications(data);
    } catch (error) {
      showError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      showError('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showSuccess('All notifications marked as read');
    } catch (error) {
      showError('Failed to update notifications');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSuccess('Notification deleted');
    } catch (error) {
      showError('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-teal-500" />;
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
              <Bell className="w-7 h-7 text-teal-600" />
            </div>
            Notifications Center
          </h1>
          <p className="text-gray-500 mt-1">Manage your clinical and operational alerts.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1 rounded-xl flex gap-1">
            <Button 
              variant={filter === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              className={cn("rounded-lg h-8 text-xs px-4", filter === 'all' && "bg-gray-900 dark:bg-white dark:text-gray-900")}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'unread' ? 'default' : 'ghost'} 
              size="sm" 
              className={cn("rounded-lg h-8 text-xs px-4", filter === 'unread' && "bg-gray-900 dark:bg-white dark:text-gray-900")}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl h-10 px-4" onClick={handleMarkAllRead} disabled={notifications.every(n => n.isRead)}>
            <MailOpen className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={fetchNotifications}>
            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-premium bg-white dark:bg-gray-900 overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            <AnimatePresence mode="popLayout">
              {notifications.length > 0 ? (
                notifications.map((n, index) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "group flex items-start gap-4 p-6 transition-all border-l-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30",
                      n.isRead ? "border-transparent opacity-70" : 
                      n.type === 'ERROR' ? "border-red-500 bg-red-50/20 dark:bg-red-900/5" :
                      n.type === 'SUCCESS' ? "border-teal-500 bg-teal-50/20 dark:bg-teal-900/5" : "border-blue-500 bg-blue-50/20 dark:bg-blue-900/5"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl",
                      n.type === 'ERROR' ? "bg-red-100 dark:bg-red-900/40 text-red-600" :
                      n.type === 'SUCCESS' ? "bg-teal-100 dark:bg-teal-900/40 text-teal-600" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
                    )}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className={cn("text-lg font-bold leading-none", !n.isRead ? "text-gray-900 dark:text-white" : "text-gray-500")}>
                            {n.title}
                          </h3>
                          {!n.isRead && <Badge className="bg-teal-500 hover:bg-teal-500 h-5 px-1.5 text-[10px] uppercase">New</Badge>}
                        </div>
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                        {n.message}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-3">
                        {!n.isRead && (
                          <Button 
                            size="sm" 
                            className="h-8 rounded-lg bg-gray-900 dark:bg-white dark:text-gray-900"
                            onClick={() => handleMarkAsRead(n.id)}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Acknowledge
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(n.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">All caught up!</h3>
                  <p className="text-gray-500 mt-2">You don't have any new notifications at the moment.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
