import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Format seconds into MM:SS format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "1:30", "0:05")
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create navigation handlers for training/assessment pages
 * @param router - Next.js router instance
 * @returns Object with handleExit and handleRestart functions
 */
export function createNavigationHandlers(router: AppRouterInstance) {
  return {
    /**
     * Navigate back to home page
     */
    handleExit: () => {
      router.push('/');
    },

    /**
     * Reload the current page (restart training/assessment)
     */
    handleRestart: () => {
      window.location.reload();
    },
  };
}
