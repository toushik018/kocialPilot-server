import { Request } from 'express';
import { IJWTPayload } from '../modules/auth/auth.interface';

export interface CustomRequest extends Request {
  user?: IJWTPayload;
}

export interface RequestWithFile extends CustomRequest {
  file?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
