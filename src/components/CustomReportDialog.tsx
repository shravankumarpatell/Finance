import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { generateCustomRangePDF } from '@/lib/pdf-generator';
import { useToast } from '@/components/ui/use-toast';

interface CustomReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageType: 'home' | 'clinic';
  selectedYear: number;
}

export default function CustomReportDialog({ 
  open, 
  onOpenChange, 
  pageType, 
  selectedYear 
}: CustomReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    
    if (!fromDate || !toDate) {
      toast({
        variant: "destructive",
        title: "Invalid Dates",
        description: "Please select both from and to dates."
      });
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "From date must be before or equal to the to date."
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateCustomRangePDF(
        user.uid,
        from,
        to,
        user.email || 'user',
        pageType
      );
      
      toast({
        title: "Report Generated",
        description: "Custom report has been downloaded successfully."
      });
      
      onOpenChange(false);
      setFromDate('');
      setToDate('');
    } catch (error) {
      console.error('Error generating custom report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate custom report. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Custom Report</DialogTitle>
          <DialogDescription>
            Select a date range to generate a custom transaction report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from-date" className="text-right">
              From
            </Label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to-date" className="text-right">
              To
            </Label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleGenerate}
            disabled={isGenerating || !fromDate || !toDate}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}