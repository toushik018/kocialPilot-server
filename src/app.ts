/* eslint-disable @typescript-eslint/no-explicit-any */

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import { CustomError } from './app/interface/error.interface';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';

const app: Application = express();

// Parsers with increased size limits for large payloads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Serve static files from the uploads directory (for local storage fallback)
if (process.env.NODE_ENV !== 'production' && process.env.USE_CLOUDINARY !== 'true') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

// Enhanced CORS configuration for kocial-pilot
const corsConfig = {
  origin: function (origin: string | undefined, callback: any) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      // Development URLs
      'http://localhost:3000',
      'http://localhost:5173',
      // Production URLs (update these with your actual domains)
      'https://kocial-pilot-client.vercel.app',
      'https://*.kocial-pilot.vercel.app',
    ];

    // Check for exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check for subdomain patterns
    const subdomainPatterns = [
      /^https?:\/\/[\w-]+\.localhost:(3000|5173)$/,
      /^https?:\/\/[\w-]+\.kocial-pilot\.vercel\.app$/,
    ];

    const isSubdomainAllowed = subdomainPatterns.some((pattern) =>
      pattern.test(origin)
    );

    if (isSubdomainAllowed) {
      return callback(null, true);
    }

    // Reject origin
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

app.use(cors(corsConfig));
app.use(cookieParser());

// Cookie configuration for kocial-pilot
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalCookie = res.cookie.bind(res);
  res.cookie = function (name: string, val: any, options: any = {}) {
    const defaultOptions = {
      domain:
        process.env.NODE_ENV === 'production'
          ? '.kocial-pilot.vercel.app'
          : 'localhost',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    return originalCookie(name, val, { ...defaultOptions, ...options });
  };
  next();
});

// Application routes
app.use('/api/v1', router);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Kocial Pilot API',
    version: '1.0.0',
    description: 'Social media management and automation platform',
    docs: '/api/docs',
    redoc: '/api/redoc',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kocial-pilot-backend',
  });
});

// Error handling
app.use(globalErrorHandler);

// Not Found
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const error: CustomError = new Error(
    `Can't find ${req.originalUrl} route on the server`
  );
  error.status = 404;
  next(error);
});

export default app;
