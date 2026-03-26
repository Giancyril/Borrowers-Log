export type ItemCategory = "EQUIPMENT" | "BOOKS" | "OFFICE_SUPPLIES" | "OTHER";
export type BorrowStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  conditionNotes: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRecord {
  id: string;
  itemId: string;
  item: Pick<Item, "id" | "name" | "category">;
  quantityBorrowed: number;
  borrowerName: string;
  borrowerEmail: string;
  borrowerDepartment: string;
  purpose: string;
  borrowDate: string;
  dueDate: string;
  actualReturnDate: string | null;
  status: BorrowStatus;
  conditionOnBorrow: string;
  conditionOnReturn: string;
  damageNotes: string;
  borrowSignature: string;
  returnSignature: string;
  processedBy: { id: string; name: string; username: string } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  activeRecords: number;
  overdueRecords: number;
  returnedRecords: number;
  dueTodayCount: number;
  dueTomorrowCount: number;
  borrowsToday: number;
  borrowsThisWeek: number;
  topItems: { itemId: string; itemName: string; count: number }[];
  recentRecords: (Pick<BorrowRecord, "id" | "borrowerName" | "status" | "createdAt"> & {
    item: Pick<Item, "id" | "name">;
  })[];
  monthlyBorrows: { month: string; count: number }[];
  monthlyOverdue: { month: string; count: number }[];
  borrowsByCategory: { category: string; count: number }[];

  // new analytics fields
  avgBorrowDays: number;
  onTimeReturnCount: number;
  lateReturnCount: number;
  onTimeRate: number;
  longestActiveBorrow: { borrowerName: string; itemName: string; days: number } | null;
  borrowsPerDay: { date: string; label: string; count: number }[];
  departmentStats: { department: string; count: number }[];
  uniqueBorrowers: number;
  avgBorrowsPerPerson: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "ADMIN";
  name: string;
}

export interface DecodedToken extends AdminUser {
  iat: number;
  exp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string;
  adminId: string | null;
  adminName: string | null;
  createdAt: string;
}