import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (
  _req: Request,
  _res: Response,
  _next: NextFunction
) => Promise<unknown>;

export const catchAsync = (fn: AsyncRequestHandler): RequestHandler => {
  return async (req, res, next): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
