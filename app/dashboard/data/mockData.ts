import {
  Utensils,
  Car,
  Home,
  Zap,
  Wifi,
  Fuel,
  ShoppingCart,
  ShoppingBag,
  Film,
  MoreHorizontal,
  Briefcase,
  Users,
  Building2,
  Percent,
  FileText,
  Landmark,
  TrendingUp,
  Tag,
  LucideIcon,
} from "lucide-react";

export const formatINR = (n: number) => "\u20B9" + new Intl.NumberFormat("en-IN").format(Math.round(n));

export interface CategoryMetaItem {
  icon: LucideIcon;
  color: string;
  bg: string;
  type: string;
}

export const expenseCategoryMeta: Record<string, CategoryMetaItem> = {
  Food: { icon: Utensils, color: "#f43f5e", bg: "#ffe4e6", type: "Variable" },
  Transport: { icon: Car, color: "#3b82f6", bg: "#dbeafe", type: "Variable" },
  Rent: { icon: Home, color: "#a855f7", bg: "#f3e8ff", type: "Fixed" },
  Electricity: { icon: Zap, color: "#f59e0b", bg: "#fef3c7", type: "Fixed" },
  Internet: { icon: Wifi, color: "#06b6d4", bg: "#cffafe", type: "Fixed" },
  Fuel: { icon: Fuel, color: "#ef4444", bg: "#fee2e2", type: "Variable" },
  Groceries: { icon: ShoppingCart, color: "#22c55e", bg: "#dcfce7", type: "Variable" },
  Shopping: { icon: ShoppingBag, color: "#ec4899", bg: "#fce7f3", type: "Variable" },
  Entertainment: { icon: Film, color: "#6366f1", bg: "#e0e7ff", type: "Variable" },
  Others: { icon: MoreHorizontal, color: "#64748b", bg: "#f1f5f9", type: "Variable" },
};

export const incomeCategoryMeta: Record<string, CategoryMetaItem> = {
  Salary: { icon: Briefcase, color: "#7c3aed", bg: "#ede9fe", type: "Fixed" },
  Freelance: { icon: Users, color: "#7c3aed", bg: "#ede9fe", type: "Variable" },
  "Business Revenue": { icon: Building2, color: "#f59e0b", bg: "#fef3c7", type: "Variable" },
  Interest: { icon: Percent, color: "#22c55e", bg: "#dcfce7", type: "Fixed" },
  "Other Income": { icon: FileText, color: "#3b82f6", bg: "#dbeafe", type: "Variable" },
};

export const paymentModes = ["UPI", "Bank Transfer", "Card", "Cash"];
export const accounts = ["HDFC Bank", "ICICI Bank"];

let _id = 1000;
export const nextId = () => _id++;

export interface Transaction {
  id: number | string;
  day: number;
  date: string;
  category: string | any;
  party: string;
  amount: number;
  mode: string;
  account: string;
  notes: string;
  kind?: string;
  status?: string;
  createdAt?: string;
}

export const initialExpenses: Transaction[] = [
  { id: nextId(), day: 14, date: "14 May 2025", category: "Food", party: "Swiggy", amount: 850, mode: "UPI", account: "HDFC Bank", notes: "Lunch" },
  { id: nextId(), day: 14, date: "14 May 2025", category: "Transport", party: "Uber", amount: 320, mode: "UPI", account: "HDFC Bank", notes: "Cab ride" },
  { id: nextId(), day: 13, date: "13 May 2025", category: "Rent", party: "Mr. Sharma", amount: 25000, mode: "Bank Transfer", account: "HDFC Bank", notes: "May Rent" },
  { id: nextId(), day: 12, date: "12 May 2025", category: "Electricity", party: "BESCOM", amount: 2500, mode: "UPI", account: "HDFC Bank", notes: "Bill Payment" },
  { id: nextId(), day: 11, date: "11 May 2025", category: "Internet", party: "Airtel", amount: 1000, mode: "UPI", account: "HDFC Bank", notes: "Monthly Pack" },
  { id: nextId(), day: 10, date: "10 May 2025", category: "Fuel", party: "IndianOil", amount: 1200, mode: "Card", account: "HDFC Bank", notes: "Bike Fuel" },
  { id: nextId(), day: 9, date: "09 May 2025", category: "Groceries", party: "Dmart", amount: 1450, mode: "UPI", account: "HDFC Bank", notes: "Weekly Groceries" },
];

export const initialIncomes: Transaction[] = [
  { id: nextId(), day: 14, date: "14 May 2025", category: "Salary", party: "ABC Pvt Ltd", amount: 60000, mode: "Bank Transfer", account: "HDFC Bank", notes: "May Salary" },
  { id: nextId(), day: 10, date: "10 May 2025", category: "Freelance", party: "Client - Rohan", amount: 25600, mode: "UPI", account: "HDFC Bank", notes: "Design project" },
  { id: nextId(), day: 8, date: "08 May 2025", category: "Business Revenue", party: "Customer A", amount: 50000, mode: "Bank Transfer", account: "HDFC Bank", notes: "Project Payment" },
  { id: nextId(), day: 5, date: "05 May 2025", category: "Interest", party: "HDFC Bank", amount: 650, mode: "Bank Transfer", account: "HDFC Bank", notes: "Savings Interest" },
  { id: nextId(), day: 3, date: "03 May 2025", category: "Other Income", party: "Refund", amount: 2350, mode: "UPI", account: "HDFC Bank", notes: "Refund" },
  { id: nextId(), day: 1, date: "01 May 2025", category: "Freelance", party: "Client - Amit", amount: 47000, mode: "Bank Transfer", account: "HDFC Bank", notes: "Freelance Work" },
].map(item => ({ ...item, source: item.category })); // Add source mapping for legacy compatibility

const extraPool = [
  { kind: "expense", category: "Food", party: "Zomato", notes: "Dinner order" },
  { kind: "expense", category: "Transport", party: "Ola", notes: "Cab ride" },
  { kind: "expense", category: "Shopping", party: "Amazon", notes: "Online order" },
  { kind: "expense", category: "Entertainment", party: "Netflix", notes: "Subscription" },
  { kind: "expense", category: "Others", party: "Misc Store", notes: "Miscellaneous" },
  { kind: "expense", category: "Groceries", party: "BigBasket", notes: "Groceries" },
  { kind: "expense", category: "Food", party: "Cafe Coffee Day", notes: "Coffee" },
  { kind: "income", source: "Freelance", party: "Client - Priya", notes: "Landing page" },
  { kind: "income", source: "Other Income", party: "Cashback", notes: "Card cashback" },
  { kind: "income", source: "Business Revenue", party: "Customer B", notes: "Project Payment" },
];

export const extraTransactions = Array.from({ length: 29 }).map((_, i) => {
  const pick = extraPool[i % extraPool.length];
  const day = ((29 - i + 1) % 28) + 1;
  const amount =
    pick.kind === "expense" ? 300 + ((i * 137) % 3200) : 4500 + ((i * 911) % 21000);
  const mode = paymentModes[i % 3];
  const account = accounts[i % 2];
  const monthDay = String(day).padStart(2, "0");
  return {
    id: nextId(),
    day,
    date: `${monthDay} May 2025`,
    kind: pick.kind,
    category: (pick.kind === "expense" ? pick.category : pick.source) || "Others",
    party: pick.party,
    amount,
    mode,
    account,
    notes: pick.notes,
  };
});

export const expensesOverTime = [
  { date: "01 May", value: 3200 },
  { date: "05 May", value: 9800 },
  { date: "08 May", value: 20200 },
  { date: "12 May", value: 22700 },
  { date: "15 May", value: 22000 },
  { date: "18 May", value: 26500 },
  { date: "22 May", value: 44000 },
  { date: "26 May", value: 38200 },
  { date: "31 May", value: 30100 },
];

export const incomeOverTime = [
  { date: "01 May", value: 12000 },
  { date: "05 May", value: 15200 },
  { date: "08 May", value: 20400 },
  { date: "12 May", value: 22600 },
  { date: "15 May", value: 24800 },
  { date: "18 May", value: 34500 },
  { date: "22 May", value: 55000 },
  { date: "26 May", value: 50200 },
  { date: "31 May", value: 48600 },
];

export const savingsOverTime = [
  { date: "01 May", value: 1800 },
  { date: "05 May", value: 8200 },
  { date: "08 May", value: 18100 },
  { date: "12 May", value: 26400 },
  { date: "15 May", value: 34000 },
  { date: "18 May", value: 42300 },
  { date: "22 May", value: 54200 },
  { date: "26 May", value: 64100 },
  { date: "31 May", value: 62420 },
];

export const categoryBreakdown = [
  { name: "Rent", value: 25000, pct: 20.3, color: "#ef4444" },
  { name: "Food", value: 22450, pct: 18.2, color: "#e11d48" },
  { name: "Transport", value: 15300, pct: 12.4, color: "#a855f7" },
  { name: "Utilities", value: 13600, pct: 11.0, color: "#3b82f6" },
  { name: "Shopping", value: 11900, pct: 9.7, color: "#f59e0b" },
  { name: "Entertainment", value: 7450, pct: 6.0, color: "#6366f1" },
  { name: "Others", value: 27480, pct: 22.4, color: "#fb923c" },
];

export const BASE_EXPENSE_OFFSET =
  123180 - initialExpenses.reduce((s, e) => s + e.amount, 0);

export const countBy = (arr: any[], key: string) => {
  const m: Record<string, number> = {};
  arr.forEach((x) => {
    const val = x[key];
    m[val] = (m[val] || 0) + 1;
  });
  return m;
};

export const INITIAL_EXPENSE_COUNTS = countBy(initialExpenses, "category");
export const INITIAL_INCOME_COUNTS = countBy(initialIncomes, "category");

export interface CategoryAuditItem {
  id: string;
  name: string;
  kind: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  baseCount: number;
  lastUsed: string | null;
  count?: number;
}

export const categoryAuditSeed: CategoryAuditItem[] = [
  { id: "c1", name: "Rent", kind: "expense", icon: Home, color: "#ef4444", bg: "#fee2e2", baseCount: 32, lastUsed: "13 May 2025" },
  { id: "c2", name: "Food", kind: "expense", icon: Utensils, color: "#f43f5e", bg: "#ffe4e6", baseCount: 28, lastUsed: "14 May 2025" },
  { id: "c3", name: "Transport", kind: "expense", icon: Car, color: "#3b82f6", bg: "#dbeafe", baseCount: 20, lastUsed: "14 May 2025" },
  { id: "c4", name: "Electricity", kind: "expense", icon: Zap, color: "#f59e0b", bg: "#fef3c7", baseCount: 8, lastUsed: "12 May 2025" },
  { id: "c5", name: "Internet", kind: "expense", icon: Wifi, color: "#06b6d4", bg: "#cffafe", baseCount: 6, lastUsed: "11 May 2025" },
  { id: "c6", name: "Fuel", kind: "expense", icon: Fuel, color: "#f97316", bg: "#ffedd5", baseCount: 12, lastUsed: "10 May 2025" },
  { id: "c7", name: "Groceries", kind: "expense", icon: ShoppingCart, color: "#22c55e", bg: "#dcfce7", baseCount: 15, lastUsed: "09 May 2025" },
  { id: "c8", name: "Shopping", kind: "expense", icon: ShoppingBag, color: "#ec4899", bg: "#fce7f3", baseCount: 10, lastUsed: "07 May 2025" },
  { id: "c9", name: "Entertainment", kind: "expense", icon: Film, color: "#6366f1", bg: "#e0e7ff", baseCount: 9, lastUsed: "06 May 2025" },
  { id: "c10", name: "Others", kind: "expense", icon: MoreHorizontal, color: "#64748b", bg: "#f1f5f9", baseCount: 14, lastUsed: "08 May 2025" },
  { id: "c11", name: "Salary", kind: "income", icon: Briefcase, color: "#7c3aed", bg: "#ede9fe", baseCount: 12, lastUsed: "14 May 2025" },
  { id: "c12", name: "Business Revenue", kind: "income", icon: Building2, color: "#f59e0b", bg: "#fef3c7", baseCount: 7, lastUsed: "08 May 2025" },
  { id: "c13", name: "Freelance", kind: "income", icon: Users, color: "#a855f7", bg: "#f3e8ff", baseCount: 5, lastUsed: "10 May 2025" },
  { id: "c14", name: "Interest", kind: "income", icon: Percent, color: "#22c55e", bg: "#dcfce7", baseCount: 3, lastUsed: "05 May 2025" },
  { id: "c15", name: "Other Income", kind: "income", icon: FileText, color: "#3b82f6", bg: "#dbeafe", baseCount: 4, lastUsed: "03 May 2025" },
  { id: "c16", name: "Rental Income", kind: "income", icon: Landmark, color: "#0ea5e9", bg: "#e0f2fe", baseCount: 0, lastUsed: null },
  { id: "c17", name: "Investment Returns", kind: "income", icon: TrendingUp, color: "#14b8a6", bg: "#ccfbf1", baseCount: 0, lastUsed: null },
  { id: "c18", name: "Gift", kind: "income", icon: Tag, color: "#ec4899", bg: "#fce7f3", baseCount: 2, lastUsed: "01 May 2025" },
];

export const CURRENT_CASH = 12450;
export const CURRENT_BANK_BALANCE = 145230;

export const fixedExpensesData = [
  { id: "f1", name: "Rent", budget: 25000, due: "01 May", status: "Paid", paid: 25000 },
  { id: "f2", name: "Internet", budget: 1000, due: "05 May", status: "Paid", paid: 1000 },
  { id: "f3", name: "Electricity", budget: 2500, due: "10 May", status: "Paid", paid: 2500 },
  { id: "f4", name: "Mobile Recharge", budget: 699, due: "15 May", status: "pending", paid: 0 },
  { id: "f5", name: "Netflix Subscription", budget: 649, due: "20 May", status: "pending", paid: 0 },
];
export const fixedExpensesExtra = [
  { id: "f6", name: "Gym Membership", budget: 1200, due: "22 May", status: "Paid", paid: 1200 },
  { id: "f7", name: "Insurance Premium", budget: 3500, due: "25 May", status: "pending", paid: 0 },
];

export const variableBudgetData = [
  { id: "v1", category: "Food", budget: 15000, spent: 8450 },
  { id: "v2", category: "Transport", budget: 6000, spent: 3250 },
  { id: "v3", category: "Shopping", budget: 8000, spent: 2900 },
  { id: "v4", category: "Entertainment", budget: 3000, spent: 1850 },
  { id: "v5", category: "Others", budget: 4000, spent: 1700 },
];
export const variableBudgetExtra = [
  { id: "v6", category: "Health", budget: 5000, spent: 4100 },
  { id: "v7", category: "Subscriptions", budget: 1500, spent: 900 },
];

export const expectedIncomeData = [
  { id: "i1", source: "Salary", expected: 60000, received: 60000 },
  { id: "i2", source: "Freelance", expected: 40000, received: 25600 },
  { id: "i3", source: "Business Revenue", expected: 80000, received: 60000 },
  { id: "i4", source: "Other Income", expected: 5000, received: 0 },
];
export const expectedIncomeExtra = [{ id: "i5", source: "Interest", expected: 1000, received: 650 }];
