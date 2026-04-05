import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'teal' | 'blue' | 'purple' | 'orange' | 'green' | 'red';
  delay?: number;
}

const colorStyles = {
  teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'teal',
  delay = 0,
}: StatCardProps) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <motion.h3
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.2 }}
                className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2"
              >
                {value}
              </motion.h3>
              {trend !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={cn(
                      'flex items-center text-sm font-medium',
                      isPositive && 'text-green-600',
                      isNegative && 'text-red-600',
                      !isPositive && !isNegative && 'text-gray-500'
                    )}
                  >
                    {isPositive && <TrendingUp className="w-4 h-4 mr-1" />}
                    {isNegative && <TrendingDown className="w-4 h-4 mr-1" />}
                    {trend > 0 ? '+' : ''}
                    {trend}%
                  </span>
                  {trendLabel && (
                    <span className="text-sm text-gray-400">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl', colorStyles[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
