import { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import type { LocalUser } from '../utils/localDb';
import { localDb } from '../utils/localDb';

interface AuthContextType {
  currentUser: LocalUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await localDb.getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser.uid);
    }
  };

  useEffect(() => {
    // Check local storage on mount
    const checkUser = async () => {
      const user = localDb.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };
    
    checkUser();
    
    // Set up a listener for storage events in case of multiple tabs
    const handleStorageChange = () => {
      const user = localDb.getCurrentUser();
      setCurrentUser(user);
      if (!user) setUserProfile(null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
