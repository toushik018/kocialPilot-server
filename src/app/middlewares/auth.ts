import { NextFunction, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import config from '../config';
import AppError from '../error/AppError';
import { AuthRequest, IJWTPayload } from '../modules/auth/auth.interface';
import { User } from '../modules/auth/auth.model';
import { AUTH_MESSAGES } from '../modules/auth/auth.constant';
import { catchAsync } from '../utils/catchAsync';

type UserRole = 'user' | 'admin';

const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'Access token is required'
        );
      }

      const token = authHeader.slice(7); // Remove 'Bearer ' prefix

      if (!token) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'Access token is required'
        );
      }

      // Verify token
      let decoded: IJWTPayload;
      try {
        decoded = jwt.verify(
          token,
          config.jwt_access_secret as string
        ) as IJWTPayload;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new AppError(
            StatusCodes.UNAUTHORIZED,
            AUTH_MESSAGES.TOKEN_REFRESH_REQUIRED
          );
        }
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid access token');
      }

      // Check if token is close to expiry (within 30 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const expiryTime = decoded.exp || 0;
      const timeUntilExpiry = expiryTime - currentTime;
      const thirtyMinutes = 30 * 60; // 30 minutes in seconds

      // Add header to suggest token refresh if close to expiry
      if (timeUntilExpiry > 0 && timeUntilExpiry < thirtyMinutes) {
        res.setHeader('X-Token-Refresh-Suggested', 'true');
        res.setHeader('X-Token-Expires-In', timeUntilExpiry.toString());
      }

      // Check if user exists and is active
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
      }

      if (!user.isActive) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'Your account has been deactivated'
        );
      }

      // Check role authorization
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(decoded.role as UserRole)
      ) {
        throw new AppError(StatusCodes.FORBIDDEN, 'Insufficient permissions');
      }

      // Attach user to request
      req.user = decoded;

      next();
    }
  );
};

export default auth;
