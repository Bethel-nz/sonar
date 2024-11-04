interface RetryConfig<T> {
  maxAttempts?: number;
  onAttempt?: (attempt: number) => void;
  onMaxAttemptsReached?: () => void;
  onSuccess?: (result: T) => void;
  onError?: (error: any, attempt: number) => void;
  resetAction?: () => void;
}


/**
* retry function for forms
*/
export async function withRetry<T>(
  action: () => Promise<T>,
  config: RetryConfig<T> = {}
) {
  const {
    maxAttempts = 3,
    onAttempt,
    onMaxAttemptsReached,
    onSuccess,
    onError,
    resetAction
  } = config;

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      onAttempt?.(attempts);

      const result = await action();
      onSuccess?.(result);
      return result;

    } catch (error) {
      onError?.(error, attempts);
      resetAction?.();

      if (attempts === maxAttempts) {
        onMaxAttemptsReached?.();
        throw error;
      }
    }
  }
} 