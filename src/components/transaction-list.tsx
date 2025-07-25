import { useState, useMemo, useEffect } from 'react';
import { Transaction } from './dashboard';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useToast } from './ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  selectedYear: number;
  workplaceId: string; // Changed from pageType to workplaceId
  workplaceName: string; // Added workplaceName for display
  selectedDate?: Date | null;
  onDateChange?: (date: Date | null) => void;
  onMonthChange?: (month: number | null) => void;
}

export default function TransactionList({ 
  transactions, 
  loading, 
  selectedYear, 
  workplaceId, 
  workplaceName,
  selectedDate, 
  onDateChange,
  onMonthChange 
}: TransactionListProps) {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return selectedYear === currentYear ? currentDate.getMonth() + 1 : 12;
  });
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset month selection when workplace changes
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const newMonth = selectedYear === currentYear ? currentDate.getMonth() + 1 : 12;
    setSelectedMonth(newMonth);
  }, [workplaceId, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get available months based on selected year
  const availableMonths = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (selectedYear === currentYear) {
      return Array.from({ length: currentMonth }, (_, i) => i + 1);
    } else {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
  }, [selectedYear]);

  // Get available dates for the selected month
  const availableDates = useMemo(() => {
    const monthTransactions = transactions.filter(transaction => transaction.month === selectedMonth);
    const uniqueDates = new Set<string>();
    
    monthTransactions.forEach(transaction => {
      const dateStr = transaction.date.toDate().toDateString();
      uniqueDates.add(dateStr);
    });
    
    return Array.from(uniqueDates).map(dateStr => new Date(dateStr)).sort((a, b) => b.getTime() - a.getTime());
  }, [transactions, selectedMonth]);

  // Filter transactions by selected date or month
  const filteredTransactions = useMemo(() => {
    if (selectedDate) {
      return transactions.filter(transaction => {
        const txDate = transaction.date.toDate();
        return txDate.toDateString() === selectedDate.toDateString();
      });
    } else {
      return transactions.filter(transaction => transaction.month === selectedMonth);
    }
  }, [transactions, selectedMonth, selectedDate]);

  // Calculate date-specific totals for display at the bottom
  const dateTotals = useMemo(() => {
    if (!selectedDate) return null;

    const dateTransactions = filteredTransactions;
    
    const incomeCash = dateTransactions
      .filter(t => t.type === 'income' && t.category === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const incomeOnline = dateTransactions
      .filter(t => t.type === 'income' && t.category === 'Online')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseCash = dateTransactions
      .filter(t => t.type === 'expense' && t.category === 'Cash')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseOnline = dateTransactions
      .filter(t => t.type === 'expense' && t.category === 'Online')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      incomeCash,
      incomeOnline,
      totalIncome: incomeCash + incomeOnline,
      expenseCash,
      expenseOnline,
      totalExpense: expenseCash + expenseOnline
    };
  }, [filteredTransactions, selectedDate]);

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    if (onDateChange) {
      onDateChange(null); // Reset date selection when month changes
    }
    if (onMonthChange) {
      onMonthChange(month); // Notify parent about month change
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (onDateChange) {
      onDateChange(date);
    }
    // When date is set to null (All Dates), make sure parent knows about current month
    if (!date && onMonthChange) {
      onMonthChange(selectedMonth);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteTransaction(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTransaction) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'transactions', deleteTransaction.id));
      
      toast({
        title: "Transaction Deleted",
        description: `${deleteTransaction.type} of ₹${deleteTransaction.amount.toFixed(2)} has been deleted.`
      });

      // Refresh the transactions list
      window.location.reload();
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction. Please try again."
      });
    } finally {
      setIsDeleting(false);
      setDeleteTransaction(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTransaction(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions for {selectedYear}</CardTitle>
              <CardDescription>
                {selectedDate 
                  ? `${workplaceName} transactions for ${format(selectedDate, 'dd/MM/yyyy')}`
                  : `Select a month and optionally a date to view ${workplaceName} transactions from ${selectedYear}.`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Month Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {monthNames[selectedMonth - 1]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableMonths.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => handleMonthChange(month)}
                      className={selectedMonth === month ? 'bg-accent' : ''}
                    >
                      {monthNames[month - 1]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Date Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {selectedDate ? format(selectedDate, 'dd/MM') : 'All Dates'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleDateChange(null)}
                    className={!selectedDate ? 'bg-accent' : ''}
                  >
                    All Dates
                  </DropdownMenuItem>
                  {availableDates.map((date) => (
                    <DropdownMenuItem
                      key={date.getTime()}
                      onClick={() => handleDateChange(date)}
                      className={selectedDate?.toDateString() === date.toDateString() ? 'bg-accent' : ''}
                    >
                      {format(date, 'dd/MM/yyyy')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] overflow-y-auto scrollbar-thin pr-2">
            {loading ? (
              <p className="pt-10 text-center">Loading...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="pt-10 text-center">
                No transactions for {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : `${monthNames[selectedMonth - 1]} ${selectedYear}`} in {workplaceName}.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.type === 'income' ? 'default' : 'destructive'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell>{tx.detail || '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {format(tx.date.toDate(), 'MMM d, p')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(tx)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTransaction} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
              {deleteTransaction && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div><strong>Type:</strong> {deleteTransaction.type}</div>
                    <div><strong>Amount:</strong> ₹{deleteTransaction.amount.toFixed(2)}</div>
                    <div><strong>Method:</strong> {deleteTransaction.category}</div>
                    {deleteTransaction.detail && (
                      <div><strong>Detail:</strong> {deleteTransaction.detail}</div>
                    )}
                    <div><strong>Date:</strong> {format(deleteTransaction.date.toDate(), 'dd/MM/yyyy, p')}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}