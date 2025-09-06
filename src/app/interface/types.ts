import { Request } from 'express';

export interface IJWTPayload {
  userId: string;
  email: string;
  username?: string;
}

export interface CustomRequest extends Request {
  user?: IJWTPayload;
}
