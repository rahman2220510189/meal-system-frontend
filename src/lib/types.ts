export type Role = "ADMIN" | "MEMBER";
export type MemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";
export type EntryStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  language: "bn" | "en";
  mustChangePassword: boolean;
  createdAt: string;
}

export interface MessListItem {
  id: string;
  name: string;
  role: Role;
  status: MemberStatus;
  membershipId: string;
  requestedAt: string;
}

export interface Month {
  id: string;
  year: number;
  month: number;
  start: string;
  end: string;
  mealsPerDay: number;
  fixedMealEnabled: boolean;
  fixedMealMin: number;
  status: "OPEN" | "CLOSED";
  closedAt: string | null;
}

export interface MessDetail {
  mess: {
    id: string;
    name: string;
    code?: string;
    breakfastWeight: number;
    breakfastCutoff: string;
    lunchCutoff: string;
    dinnerCutoff: string;
  };
  me: { membershipId: string; role: Role };
  months: Month[];
  pendingMembers: number;
}

export interface MemberRow {
  membershipId: string;
  userId: string;
  name: string;
  role: Role;
  status: MemberStatus;
  activeDays: number;
  activeFrom: string;
  activeTo: string | null;
  ownMeals: number;
  guestMeals: number;
  minMeals: number;
  shortfall: number;
  billedMeals: number;
  mealCost: number;
  sharedCost: number;
  totalCost: number;
  deposit: number;
  carryIn: number;
  balance: number;
  finalBalance: number | null;
}

export interface Summary {
  month: Month;
  countedUpTo: string;
  isFinal: boolean;
  mealRate: number;
  totals: {
    ownMeals: number;
    guestMeals: number;
    billedMeals: number;
    bazar: number;
    sharedCost: number;
    deposit: number;
    carryIn: number;
    totalCost: number;
    cashInHand: number;
    totalDue: number;
    totalPlus: number;
    pendingBazar: number;
    pendingBazarCount: number;
    approvedBazarCount: number;
    pendingDepositCount: number;
  };
  members: MemberRow[];
  today: null | {
    date: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    guestBreakfast: number;
    guestLunch: number;
    guestDinner: number;
    duty: { membershipId: string; name: string }[];
  };
  daily: { date: string; own: number; guest: number }[];
}

export interface MealEntry {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  guestBreakfast: number;
  guestLunch: number;
  guestDinner: number;
}

export interface Entry {
  id: string;
  date: string;
  amount: number;
  status: EntryStatus;
  rejectReason: string | null;
  membershipId: string;
  memberName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  reviewedAt: string | null;
  items?: string | null;
  receiptUrl?: string | null;
  note?: string | null;
}

export interface MemberListRow {
  membershipId: string;
  userId: string;
  name: string;
  email?: string;
  phone: string | null;
  role: Role;
  status: MemberStatus;
  requestedAt: string;
  approvedAt: string | null;
  removedAt: string | null;
}
