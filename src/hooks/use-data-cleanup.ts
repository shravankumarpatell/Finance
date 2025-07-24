import { useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/use-auth';

export const useDataCleanup = () => {
  const { user } = useAuth();

  useEffect(() => {
    const checkAndCleanupData = async () => {
      if (!user) return;

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // January = 1
      const currentDay = currentDate.getDate();

      // Only run cleanup after January 31st of current year
      if (currentMonth === 2 && currentDay >= 1) { // February 1st or later
        const previousYear = currentYear - 1;
        
        try {
          // Query transactions from previous year
          const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            where('year', '==', previousYear)
          );
          
          const querySnapshot = await getDocs(q);
          
          // Delete transactions in batches (Firestore free tier limitation)
          const deletePromises = querySnapshot.docs.map(docSnapshot => 
            deleteDoc(doc(db, 'transactions', docSnapshot.id))
          );
          
          await Promise.all(deletePromises);
          
          console.log(`Cleaned up ${querySnapshot.docs.length} transactions from ${previousYear}`);
        } catch (error) {
          console.error('Error during data cleanup:', error);
        }
      }
    };

    // Run cleanup check when component mounts
    checkAndCleanupData();
  }, [user]);
};

// You can also create a manual cleanup function for testing
export const manualDataCleanup = async (userId: string, yearToDelete: number) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('year', '==', yearToDelete)
    );
    
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'transactions', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
    
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    throw error;
  }
};