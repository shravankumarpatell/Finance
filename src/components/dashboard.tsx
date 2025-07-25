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
import { TrendingDown, TrendingUp, Banknote, CreditCard } from "lucide-react";

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
  workplaceId: string; // Changed from pageType to workplaceId
}

interface DashboardProps {
  selectedYear: number;
  workplaceId: string; // Changed from pageType to workplaceId
  workplaceName: string; // Added workplaceName for display
  selectedDate?: Date | null;
  selectedMonth?: number | null;
  onDateChange?: (date: Date | null) => void;
}

export default function Dashboard({ 
  selectedYear, 
  workplaceId, 
  workplaceName,
  selectedDate, 
  selectedMonth, 
  onDateChange 
}: DashboardProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalSelectedMonth, setInternalSelectedMonth] = useState<number | null>(selectedMonth || null);
  const [displayTotals, setDisplayTotals] = useState({
    totalIncome: 0,
    totalExpense: 0,
    incomeCash: 0,
    incomeOnline: 0,
    expenseCash: 0,
    expenseOnline: 0,
  });

  // Force component re-render when workplaceId changes
  const [componentKey, setComponentKey] = useState(0);

  const fetchTransactions = async () => {
    if (!user || !workplaceId) {
      console.log('Cannot fetch - missing user or workplaceId:', { user: !!user, workplaceId });
      return;
    }
    
    console.log('Fetching transactions for workplace:', workplaceId); // Debug log
    setLoading(true);
    
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const monthToShow = selectedYear === currentYear ? currentMonth : 12;

      const q = query(
        collection(db, "transactions"), 
        where("userId", "==", user.uid),
        where("workplaceId", "==", workplaceId),
        where("year", "==", selectedYear),
        where("month", "<=", monthToShow),
        orderBy("month", "desc"),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const allTransactions = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
      );

      console.log(`Fetched ${allTransactions.length} transactions for workplace ${workplaceId}`);
      setTransactions(allTransactions);
      calculateDisplayTotals(allTransactions, selectedDate, internalSelectedMonth, currentMonth, currentYear);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDisplayTotals = (allTransactions: Transaction[], selectedDate: Date | null, selectedMonth: number | null, currentMonth: number, currentYear: number) => {
    let relevantTransactions: Transaction[] = [];

    if (selectedDate) {
      // Filter by specific date
      relevantTransactions = allTransactions.filter(t => {
        const txDate = t.date.toDate();
        return txDate.toDateString() === selectedDate.toDateString();
      });
    } else if (selectedMonth) {
      // Filter by selected month (when "All Dates" is selected for a specific month)
      relevantTransactions = allTransactions.filter(t => t.month === selectedMonth);
    } else {
      // Default: Show current month totals
      const monthToShow = selectedYear === currentYear ? currentMonth : currentMonth;
      relevantTransactions = allTransactions.filter(t => t.month === monthToShow);
    }

    const incomeCash = relevantTransactions
      .filter(t => t.type === 'income' && t.category === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const incomeOnline = relevantTransactions
      .filter(t => t.type === 'income' && t.category === 'Online')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseCash = relevantTransactions
      .filter(t => t.type === 'expense' && t.category === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseOnline = relevantTransactions
      .filter(t => t.type === 'expense' && t.category === 'Online')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = incomeCash + incomeOnline;
    const totalExpense = expenseCash + expenseOnline;

    setDisplayTotals({ 
      totalIncome, 
      totalExpense, 
      incomeCash, 
      incomeOnline, 
      expenseCash, 
      expenseOnline 
    });
  };

  useEffect(() => {
    console.log('Dashboard useEffect triggered - workplaceId:', workplaceId);
    if (user && workplaceId) {
      fetchTransactions();
    }
  }, [user, selectedYear, workplaceId]);

  // Force component refresh when workplaceId changes
  useEffect(() => {
    console.log('WorkplaceId changed, forcing component refresh');
    setComponentKey(prev => prev + 1);
    setTransactions([]); // Clear previous transactions immediately
    setDisplayTotals({
      totalIncome: 0,
      totalExpense: 0,
      incomeCash: 0,
      incomeOnline: 0,
      expenseCash: 0,
      expenseOnline: 0,
    });
  }, [workplaceId]);

  // Reset selected date and month when workplace changes
  useEffect(() => {
    if (onDateChange) {
      onDateChange(null);
    }
    setInternalSelectedMonth(null);
  }, [workplaceId]);

  useEffect(() => {
    if (transactions.length > 0) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      calculateDisplayTotals(transactions, selectedDate, internalSelectedMonth, currentMonth, currentYear);
    }
  }, [selectedDate, internalSelectedMonth, transactions, selectedYear]);

  const getTimeframeText = () => {
    if (selectedDate) {
      return `Selected Date's`;
    } else if (internalSelectedMonth) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[internalSelectedMonth - 1]}'s`;
    }
    return `This Month's`;
  };

  if (!workplaceId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium">No Workplace Selected</h3>
          <p className="text-muted-foreground">Please select a workplace to view transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:gap-8">
      {/* Top Row - All 4 boxes: Total Income, Income Breakdown, Total Expense, Expense Breakdown */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getTimeframeText()} Total Income
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayTotals.totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Income Breakdown
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium">Cash:</span>
                </div>
                <span className="text-sm font-bold text-green-600">₹{displayTotals.incomeCash.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium">Online:</span>
                </div>
                <span className="text-sm font-bold text-blue-600">₹{displayTotals.incomeOnline.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {getTimeframeText()} Total Expense
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayTotals.totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expense Breakdown
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Banknote className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium">Cash:</span>
                </div>
                <span className="text-sm font-bold text-red-600">₹{displayTotals.expenseCash.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-orange-600" />
                  <span className="text-xs font-medium">Online:</span>
                </div>
                <span className="text-sm font-bold text-orange-600">₹{displayTotals.expenseOnline.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Transaction Form and List */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8">
        <div>
          <TransactionForm 
            onTransactionAdded={fetchTransactions} 
            selectedYear={selectedYear}
            workplaceId={workplaceId}
            workplaceName={workplaceName}
          />
        </div>
        <div>
          <TransactionList 
            transactions={transactions} 
            loading={loading} 
            selectedYear={selectedYear}
            workplaceId={workplaceId}
            workplaceName={workplaceName}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            onMonthChange={setInternalSelectedMonth}
          />
        </div>
      </div>
    </div>
  );
}