import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TransactionFormProps {
  onTransactionAdded: () => void;
  selectedYear: number;
  pageType: 'home' | 'clinic';
}

export default function TransactionForm({ onTransactionAdded, selectedYear, pageType }: TransactionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'Online'>('Cash');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [detail, setDetail] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) {
        toast({ variant: "destructive", title: "Please enter an amount." });
        return;
    }

    if (!selectedDate) {
        toast({ variant: "destructive", title: "Please select a date." });
        return;
    }

    // Parse the selected date and preserve the current time
    const transactionDate = new Date(selectedDate);
    const now = new Date();
    
    // Set the time to current time but keep the selected date
    transactionDate.setHours(now.getHours());
    transactionDate.setMinutes(now.getMinutes());
    transactionDate.setSeconds(now.getSeconds());

    // Validate that the selected date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (transactionDate > today) {
        toast({ 
            variant: "destructive", 
            title: "Invalid Date", 
            description: "Cannot add transactions for future dates." 
        });
        return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type,
        category: method,
        amount: parseFloat(amount),
        date: Timestamp.fromDate(transactionDate),
        detail: detail || '',
        year: transactionDate.getFullYear(),
        month: transactionDate.getMonth() + 1, // 1-12
        pageType: pageType,
      });
      
      setAmount('');
      setDetail('');
      // Keep the selected date so user can add multiple transactions for the same date
      toast({ title: "Success!", description: `Transaction added for ${transactionDate.toLocaleDateString()}.` });
      onTransactionAdded();
    } catch (error) {
      toast({ variant: "destructive", title: "Error adding transaction", description: (error as Error).message });
    }
  };

  const getDetailLabel = () => {
    if (pageType === 'clinic') return null;
    return type === 'income' ? 'From whom' : 'To whom';
  };

  const getDetailPlaceholder = () => {
    if (pageType === 'clinic') return '';
    return type === 'income' ? 'Enter name of income source' : 'Enter name of expense recipient';
  };

  // Get min and max dates for the date picker
  const getDateLimits = () => {
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0]; // Today's date
    
    // Allow selection from 3 months ago to today
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 3);
    const minDateStr = minDate.toISOString().split('T')[0];
    
    return { minDate: minDateStr, maxDate };
  };

  const { minDate, maxDate } = getDateLimits();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Transaction</CardTitle>
        <CardDescription>
          Log your income and expenses for {selectedYear}. Select any date to add transactions for that specific day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income" onValueChange={(value) => setType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Date Selection */}
                <div className="space-y-2">
                    <Label htmlFor="transaction-date">Transaction Date</Label>
                    <Input 
                        id="transaction-date"
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={minDate}
                        max={maxDate}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        You can select any date from the last 3 months to today
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Method</Label>
                    <Tabs defaultValue="Cash" onValueChange={(value) => setMethod(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="Cash">Cash</TabsTrigger>
                            <TabsTrigger value="Online">Online</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                {pageType === 'home' && getDetailLabel() && (
                  <div className="space-y-2">
                    <Label htmlFor="detail">{getDetailLabel()}</Label>
                    <Input 
                      id="detail" 
                      type="text" 
                      value={detail} 
                      onChange={(e) => setDetail(e.target.value)} 
                      placeholder={getDetailPlaceholder()}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                        id="amount" 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder="0.00" 
                    />
                </div>
                
                <Button type="submit" className="w-full">
                    Add Transaction for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Selected Date'}
                </Button>
            </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}