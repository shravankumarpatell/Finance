import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
    import { auth } from '@/firebase/config';
    import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

    interface AuthContextType {
      user: User | null;
      loading: boolean;
      signOut: () => Promise<void>;
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    export const AuthProvider = ({ children }: { children: ReactNode }) => {
      const [user, setUser] = useState<User | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });

        return () => unsubscribe();
      }, []);

      const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
      };

      const value = { user, loading, signOut };

      return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };

    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };