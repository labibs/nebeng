// src/lib/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';

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
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (error) {
        console.warn('User belum ada di Supabase (akan dibuat via webhook):', error);
      } else {
        setSupabaseUserId(data.id);
        console.log('User Supabase ID:', data.id);
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