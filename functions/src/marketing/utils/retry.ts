/**
 * Retry utility with exponential backoff
 * Used for resilient API calls to external services
 */

interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        onRetry
    } = options;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;

            if (isLastAttempt) {
                throw error;
            }

            const delay = Math.min(
                initialDelay * Math.pow(2, attempt),
                maxDelay
            );

            if (onRetry) {
                onRetry(attempt + 1, error);
            }

            console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Should not reach here');
}
