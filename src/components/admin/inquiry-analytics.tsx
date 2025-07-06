'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon, UsersIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

interface Inquiry {
  id: string;
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'offer_made' | 'accepted' | 'rejected' | 'closed';
  submittedAt: any;
  rentAmount: number;
}

interface InquiryAnalyticsProps {
  inquiries: Inquiry[];
}

export default function InquiryAnalytics({ inquiries }: InquiryAnalyticsProps) {
  const analytics = useMemo(() => {
    const total = inquiries.length;
    const newInquiries = inquiries.filter(i => i.status === 'new').length;
    const activeInquiries = inquiries.filter(i => 
      ['new', 'contacted', 'viewing_scheduled', 'offer_made'].includes(i.status)
    ).length;
    const completedInquiries = inquiries.filter(i => 
      ['accepted', 'rejected', 'closed'].includes(i.status)
    ).length;
    const conversionRate = total > 0 ? (completedInquiries / total * 100).toFixed(1) : '0';
    const totalValue = inquiries
      .filter(i => i.status === 'accepted')
      .reduce((sum, i) => sum + (i.rentAmount || 0), 0);

    // Calculate average response time (simplified)
    const recentInquiries = inquiries
      .filter(i => i.status !== 'new' && i.submittedAt)
      .slice(0, 10); // Last 10 processed inquiries

    return {
      total,
      newInquiries,
      activeInquiries,
      completedInquiries,
      conversionRate,
      totalValue,
      recentInquiries: recentInquiries.length,
    };
  }, [inquiries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.total}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.newInquiries} new this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.activeInquiries}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.newInquiries} need attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {analytics.completedInquiries} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Ksh {analytics.totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            From accepted inquiries
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 