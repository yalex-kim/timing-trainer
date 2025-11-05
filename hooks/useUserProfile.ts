import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types/evaluation';
import { calculateAge } from '@/utils/evaluator';

/**
 * User Profile Hook
 * Loads user profile from localStorage and redirects to home if not found
 *
 * @returns {Object} Object containing the user profile or null
 */
export function useUserProfile() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem('userProfile');
    if (stored) {
      try {
        const profile = JSON.parse(stored) as UserProfile;
        profile.age = calculateAge(profile.birthDate);
        setUserProfile(profile);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to parse user profile:', error);
        setIsLoading(false);
        alert('사용자 정보를 불러오는데 실패했습니다.');
        router.push('/');
      }
    } else {
      setIsLoading(false);
      alert('사용자 정보를 먼저 입력해주세요.');
      router.push('/');
    }
  }, [router]);

  return { userProfile, isLoading };
}
