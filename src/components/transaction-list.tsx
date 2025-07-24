import { useState, useMemo } from 'react';
import { Transaction } from './dashboard';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { generateMonthlyPDF } from '@/lib/pdf-generator';
import { useAuth } from '@/hooks/use-auth';

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  selectedYear: number;
  pageType: 'home' | 'clinic'; // Add pageType prop
}

export default function TransactionList({ transactions, loading, selectedYear, pageType }: TransactionListProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    return selectedYear === currentYear ? currentDate.getMonth() + 1 : 12;
  });
  const [isDownloading, setIsDownloading] = useState(false);

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
      // For current year, show months up to current month
      return Array.from({ length: currentMonth }, (_, i) => i + 1);
    } else {
      // For previous year, show all 12 months
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
  }, [selectedYear]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => transaction.month === selectedMonth);
  }, [transactions, selectedMonth]);

  const handleMonthlyDownload = async () => {
    if (!user) return;

    setIsDownloading(true);
    try {
      await generateMonthlyPDF(
        filteredTransactions,
        selectedMonth,
        selectedYear,
        user.email || 'user',
        pageType // Pass pageType to PDF generator
      );
    } catch (error) {
      console.error('Error generating monthly PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions for {selectedYear}</CardTitle>
            <CardDescription>
              Select a month to view transactions from {selectedYear}.
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
                    onClick={() => setSelectedMonth(month)}
                    className={selectedMonth === month ? 'bg-accent' : ''}
                  >
                    {monthNames[month - 1]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Monthly Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMonthlyDownload}
              disabled={isDownloading || filteredTransactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-y-auto scrollbar-thin pr-2">
          {loading ? (
            <p className="pt-10 text-center">Loading...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="pt-10 text-center">
              No transactions for {monthNames[selectedMonth - 1]} {selectedYear}.
            </p>
          ) : (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Detail</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Date</TableHead>
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
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}