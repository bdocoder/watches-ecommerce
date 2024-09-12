import {Next, NonVoid} from '@loopback/core';
import {MiddlewareContext} from '@loopback/rest';
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

export async function RateLimiterMiddleware(
  context: MiddlewareContext,
  next: Next,
) {
  return new Promise<NonVoid>((resolve, reject) => {
    rateLimiter(context.request, context.response, result => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(next());
      }
    });
  });
}
