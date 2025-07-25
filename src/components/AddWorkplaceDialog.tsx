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
import { useToast } from '@/components/ui/use-toast';
import { useWorkplaces } from '@/hooks/use-workplaces';
import { Briefcase } from 'lucide-react';

interface AddWorkplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddWorkplaceDialog({ 
  open, 
  onOpenChange 
}: AddWorkplaceDialogProps) {
  const { toast } = useToast();
  const { createWorkplace, switchWorkplace} = useWorkplaces();
  const [workplaceName, setWorkplaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!workplaceName.trim()) {
      toast({
        variant: "destructive",
        title: "Please enter a workplace name."
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const newWorkplace = await createWorkplace(workplaceName);
      
      if (newWorkplace) {
        toast({
          title: "Workplace Created!",
          description: `${workplaceName} workplace has been created successfully.`
        });

        // Switch to the new workplace
        switchWorkplace(newWorkplace);
        
        // Close dialog and reset form
        onOpenChange(false);
        setWorkplaceName('');
        
        // Force page reload to ensure new workplace data loads
        console.log('New workplace created, forcing page reload...');
        setTimeout(() => {
          window.location.reload();
        }, 500); // Slightly longer delay to ensure toast is visible
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create workplace. Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
      setWorkplaceName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <DialogTitle>Add New Workplace</DialogTitle>
          </div>
          <DialogDescription>
            Create a new workplace to organize your finances separately. Each workplace will have its own transactions and reports.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-workplace-name">Workplace Name</Label>
            <Input
              id="new-workplace-name"
              type="text"
              placeholder="e.g., Business, Side Project, Freelance"
              value={workplaceName}
              onChange={(e) => setWorkplaceName(e.target.value)}
              disabled={isCreating}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Choose a unique name that helps you identify this workplace
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleCreate}
            disabled={isCreating || !workplaceName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Workplace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}