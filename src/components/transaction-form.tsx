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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) {
        toast({ variant: "destructive", title: "Please enter an amount." });
        return;
    }

    const now = new Date();
    const transactionDate = new Date(selectedYear, now.getMonth(), now.getDate());

    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type,
        category: method,
        amount: parseFloat(amount),
        date: Timestamp.fromDate(transactionDate),
        detail: detail || '',
        year: selectedYear,
        month: now.getMonth() + 1, // 1-12
        pageType: pageType, // Add page type to distinguish home vs clinic
      });
      
      setAmount('');
      setDetail('');
      toast({ title: "Success!", description: "Transaction added." });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a New Transaction</CardTitle>
        <CardDescription>Log your daily income and expenses for {selectedYear}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income" onValueChange={(value) => setType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <Button type="submit" className="w-full">Add Transaction</Button>
            </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}