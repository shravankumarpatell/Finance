// contexts/workplace-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';

export interface Workplace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  isActive: boolean;
}

interface WorkplaceContextType {
  workplaces: Workplace[];
  currentWorkplace: Workplace | null;
  loading: boolean;
  createWorkplace: (name: string) => Promise<Workplace | null>;
  switchWorkplace: (workplace: Workplace) => void;
  refetchWorkplaces: () => Promise<void>;
}

const WorkplaceContext = createContext<WorkplaceContextType | undefined>(undefined);

export const WorkplaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [currentWorkplace, setCurrentWorkplace] = useState<Workplace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkplaces = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'workplaces'),
        where('userId', '==', user.uid),
        where('isActive', '==', true),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedWorkplaces = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Workplace[];

      setWorkplaces(fetchedWorkplaces);

      // Set current workplace from localStorage or first workplace
      const savedWorkplaceId = localStorage.getItem('currentWorkplaceId');
      let currentWp = null;
      
      if (savedWorkplaceId) {
        currentWp = fetchedWorkplaces.find(wp => wp.id === savedWorkplaceId);
      }
      
      if (!currentWp && fetchedWorkplaces.length > 0) {
        currentWp = fetchedWorkplaces[0];
      }

      if (currentWp) {
        setCurrentWorkplace(currentWp);
        localStorage.setItem('currentWorkplaceId', currentWp.id);
      }

    } catch (error) {
      console.error('Error fetching workplaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkplace = async (name: string): Promise<Workplace | null> => {
    if (!user) return null;

    try {
      // Check if workplace name already exists
      const existingQuery = query(
        collection(db, 'workplaces'),
        where('userId', '==', user.uid),
        where('name', '==', name.trim()),
        where('isActive', '==', true)
      );
      
      const existingWorkplaces = await getDocs(existingQuery);
      
      if (!existingWorkplaces.empty) {
        throw new Error('Workplace with this name already exists');
      }

      // Create new workplace
      const workplaceDoc = await addDoc(collection(db, 'workplaces'), {
        userId: user.uid,
        name: name.trim(),
        createdAt: new Date(),
        isActive: true
      });

      const newWorkplace: Workplace = {
        id: workplaceDoc.id,
        name: name.trim(),
        userId: user.uid,
        createdAt: new Date(),
        isActive: true
      };

      setWorkplaces(prev => [...prev, newWorkplace]);
      return newWorkplace;

    } catch (error) {
      console.error('Error creating workplace:', error);
      throw error;
    }
  };

  const switchWorkplace = (workplace: Workplace) => {
    console.log('Context: Switching to workplace:', workplace.name);
    setCurrentWorkplace(workplace);
    localStorage.setItem('currentWorkplaceId', workplace.id);
    
    // Force a complete page reload as a fallback
    // This ensures all components get fresh data
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  useEffect(() => {
    fetchWorkplaces();
  }, [user]);

  const value = {
    workplaces,
    currentWorkplace,
    loading,
    createWorkplace,
    switchWorkplace,
    refetchWorkplaces: fetchWorkplaces
  };

  return (
    <WorkplaceContext.Provider value={value}>
      {children}
    </WorkplaceContext.Provider>
  );
};

export const useWorkplaces = () => {
  const context = useContext(WorkplaceContext);
  if (context === undefined) {
    throw new Error('useWorkplaces must be used within a WorkplaceProvider');
  }
  return context;
};