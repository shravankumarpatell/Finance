import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import TransactionForm from "@/components/transaction-form";
import TransactionList from "@/components/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: "Cash" | "Online";
  amount: number;
  date: Timestamp;
  userId: string;
  detail?: string;
  year: number;
  month: number;
  pageType: 'home' | 'clinic'; // New field to separate home and clinic data
}

interface DashboardProps {
  selectedYear: number;
  pageType: 'home' | 'clinic';
}

export default function Dashboard({ selectedYear, pageType }: DashboardProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTotals, setMonthlyTotals] = useState({
    incomeCash: 0,
    incomeOnline: 0,
    expenseCash: 0,
    expenseOnline: 0,
  });

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // If selected year is current year, show current month
    // If selected year is previous year, show all 12 months
    const monthToShow = selectedYear === currentYear ? currentMonth : 12;

    const q = query(
      collection(db, "transactions"), 
      where("userId", "==", user.uid),
      where("pageType", "==", pageType), // Filter by page type
      where("year", "==", selectedYear),
      where("month", "<=", monthToShow),
      orderBy("month", "desc"),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const allTransactions = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
    );

    setTransactions(allTransactions);

    // Calculate totals for current month only
    const currentMonthTransactions = allTransactions.filter(
      t => t.month === monthToShow
    );

    const incomeCash = currentMonthTransactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const incomeOnline = currentMonthTransactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    const expenseCash = currentMonthTransactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const expenseOnline = currentMonthTransactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    
    setMonthlyTotals({ incomeCash, incomeOnline, expenseCash, expenseOnline });
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, selectedYear]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Income (Cash)
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlyTotals.incomeCash.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Income (Online)
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlyTotals.incomeOnline.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Expense (Cash)
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlyTotals.expenseCash.toFixed(2)}</div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            This Month's Expense (Online)
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{monthlyTotals.expenseOnline.toFixed(2)}</div>
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
        <TransactionForm 
          onTransactionAdded={fetchTransactions} 
          selectedYear={selectedYear}
          pageType={pageType}
        />
      </div>
      <div className="lg:col-span-2">
        <TransactionList 
          transactions={transactions} 
          loading={loading} 
          selectedYear={selectedYear}
          pageType={pageType}
        />
      </div>
    </div>
  );
}