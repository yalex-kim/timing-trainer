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
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      try {
        const profile = JSON.parse(stored) as UserProfile;
        profile.age = calculateAge(profile.birthDate);
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to parse user profile:', error);
        alert('사용자 정보를 불러오는데 실패했습니다.');
        router.push('/');
      }
    } else {
      alert('사용자 정보를 먼저 입력해주세요.');
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  return { userProfile, isLoading };
}
