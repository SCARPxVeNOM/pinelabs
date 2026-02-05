/**
 * useLinera Hook
 * 
 * Convenience hook for accessing Linera wallet state and methods.
 */

import { useLineraContext } from '@/context/LineraContext';

export function useLinera() {
    return useLineraContext();
}

export default useLinera;
