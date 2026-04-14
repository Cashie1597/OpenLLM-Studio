import { useState } from 'react';
import { validateHfToken } from '../lib/tauri';
import { useAppStore } from '../store/appStore';

export function useHfToken() {
  const { hfToken, hfUsername, setHfToken, setHfUsername, addToast } = useAppStore();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateToken = async (token: string) => {
    console.log('[useHfToken] Starting token validation');
    console.log('[useHfToken] Token length:', token.length);
    console.log('[useHfToken] Token prefix:', token.substring(0, 10) + '...');
    
    setIsValidating(true);
    setError(null);
    
    try {
      console.log('[useHfToken] Calling validateHfToken command...');
      const username = await validateHfToken(token);
      console.log('[useHfToken] Validation successful, username:', username);
      
      setHfToken(token);
      setHfUsername(username);
      addToast(`Successfully authenticated as ${username}`, 'success');
      return username;
    } catch (err) {
      console.error('[useHfToken] Validation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Invalid token';
      console.error('[useHfToken] Error message:', errorMessage);
      setError(errorMessage);
      addToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsValidating(false);
      console.log('[useHfToken] Validation complete');
    }
  };

  const clearToken = () => {
    setHfToken(null);
    setHfUsername(null);
    setError(null);
    addToast('Token cleared', 'info');
  };

  return {
    token: hfToken,
    username: hfUsername,
    isValidating,
    error,
    validateToken,
    clearToken,
  };
}
