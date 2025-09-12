/* eslint-disable @typescript-eslint/ban-ts-comment */
import jwt from 'jsonwebtoken';
import { IJWTPayload } from './auth.interface';

export const createToken = (
  jwtPayload: IJWTPayload,
  secret: string,
  expiresIn: string
): string => {
  // @ts-ignore
  return jwt.sign(jwtPayload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string): IJWTPayload => {
  // @ts-ignore
  return jwt.verify(token, secret) as IJWTPayload;
};

export const validatePassword = (password: string): boolean => {
  // Password must be at least 6 characters long
  return password.length >= 6;
};
