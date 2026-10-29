// src/lib/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiFetch } from '../lib/apiClient';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [supabaseUserId, setSupabaseUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    const fetchSupabaseId = async () => {
      try {
        const data = await apiFetch(`/users/${user.id}`);
        if (data) {
          setSupabaseUserId(data.id || null);
        }
      } catch (error) {
        console.warn('User belum ada di backend (akan dibuat via webhook):', error);
      }
      setLoading(false);
    };

    fetchSupabaseId();
  }, [isLoaded, user]);

  return (
    <UserContext.Provider value={{ supabaseUserId, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useSupabaseUserId() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useSupabaseUserId harus di dalam UserProvider');
  }
  return context;
}