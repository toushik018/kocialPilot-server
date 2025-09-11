import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,

  // Database Configuration
  database_url: process.env.DATABASE_URL,

  // Authentication
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  default_password: process.env.DEFAULT_PASSWORD,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  // Cloudinary Configuration
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  // File Upload Configuration
  upload_dir: process.env.UPLOAD_DIR || 'uploads',
  max_file_size: process.env.MAX_FILE_SIZE || '10mb',

  // Social Media APIs
  meta_app_id: process.env.META_APP_ID,
  meta_app_secret: process.env.META_APP_SECRET,

  // OAuth Configuration
  oauth: {
    facebook: {
      app_id: process.env.FACEBOOK_APP_ID,
      app_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
    },
    instagram: {
      app_id: process.env.INSTAGRAM_APP_ID,
      app_secret: process.env.INSTAGRAM_APP_SECRET,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
    },
    twitter: {
      client_id: process.env.TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET,
      redirect_uri: process.env.TWITTER_REDIRECT_URI,
    },
    linkedin: {
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    },
  },

  // Frontend URL
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
};
