export interface PlatformStats {
  totalBusinesses: number;
  totalUsers: number;
  totalStaff: number;
  totalSales: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingLeads: number;
  openSupportTickets: number;
}

export interface PlatformActivity {
  id: string;
  type: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: Date;
}
