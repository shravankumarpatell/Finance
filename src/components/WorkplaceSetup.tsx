import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase } from 'lucide-react';

interface WorkplaceSetupProps {
  onWorkplaceCreated: (workplaceId: string, workplaceName: string) => void;
}

export default function WorkplaceSetup({ onWorkplaceCreated }: WorkplaceSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workplaceName, setWorkplaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkplace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !workplaceName.trim()) {
      toast({
        variant: "destructive",
        title: "Please enter a workplace name."
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Check if workplace name already exists for this user
      const existingWorkplaceQuery = query(
        collection(db, 'workplaces'),
        where('userId', '==', user.uid),
        where('name', '==', workplaceName.trim())
      );
      
      const existingWorkplaces = await getDocs(existingWorkplaceQuery);
      
      if (!existingWorkplaces.empty) {
        toast({
          variant: "destructive",
          title: "Workplace Already Exists",
          description: "A workplace with this name already exists. Please choose a different name."
        });
        setIsCreating(false);
        return;
      }

      // Create new workplace
      const workplaceDoc = await addDoc(collection(db, 'workplaces'), {
        userId: user.uid,
        name: workplaceName.trim(),
        createdAt: new Date(),
        isActive: true
      });

      toast({
        title: "Workplace Created!",
        description: `${workplaceName} workplace has been created successfully.`
      });

      // Call the callback and force page reload
      onWorkplaceCreated(workplaceDoc.id, workplaceName.trim());
      
      // Force page reload to ensure the app loads with the new workplace
      console.log('First workplace created, forcing page reload...');
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Longer delay to ensure user sees the success message
      
    } catch (error) {
      console.error('Error creating workplace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workplace. Please try again."
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Briefcase className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to FinTrack!</CardTitle>
          <CardDescription>
            Let's get started by creating your first workplace. You can create multiple workplaces to organize your finances separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorkplace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workplace-name">Workplace Name</Label>
              <Input
                id="workplace-name"
                type="text"
                placeholder="e.g., Personal, Business, Clinic"
                value={workplaceName}
                onChange={(e) => setWorkplaceName(e.target.value)}
                disabled={isCreating}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Choose a name that helps you identify this workplace (e.g., Personal, Business, Clinic)
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCreating || !workplaceName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Workplace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}