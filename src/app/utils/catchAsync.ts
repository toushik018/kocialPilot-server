import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler<T = Request> = (
  _req: T,
  _res: Response,
  _next: NextFunction
) => Promise<unknown>;

export const catchAsync = <T = Request>(
  fn: AsyncRequestHandler<T>
): RequestHandler => {
  return async (req, res, next): Promise<void> => {
    try {
      await fn(req as T, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export type { AsyncRequestHandler };
