import { Router } from 'express';

import { AIRoutes } from '../app/modules/ai/ai.route';
import { AuthRoute } from '../app/modules/auth/auth.route';
import { DashboardRoutes } from '../app/modules/dashboard/dashboard.route';
import { ImageRoutes } from '../app/modules/image/image.route';
import { MongoPdfRoutes } from '../app/modules/mongo-pdf/mongo-pdf.route';
import { MongoPostRoutes } from '../app/modules/mongo-posts/mongo-posts.route';
import { NotificationRoutes } from '../app/modules/notification/notification.route';
import { OAuthRoutes } from '../app/modules/oauth/oauth.route';
import { ScheduleRoutes } from '../app/modules/schedule/schedule.route';
import { SearchRoutes } from '../app/modules/search/search.route';
import { SettingsRoutes } from '../app/modules/settings/settings.route';
import { OAuthRoutes as SocialMediaOAuthRoutes } from '../app/modules/social-media/oauth.route';
import { SocialMediaRoutes } from '../app/modules/social-media/social-media.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { VideoRoutes } from '../app/modules/video/video.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoute,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/mongo-posts',
    route: MongoPostRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/mongo-pdf',
    route: MongoPdfRoutes,
  },
  {
    path: '/social-media',
    route: SocialMediaRoutes,
  },
  {
    path: '/images',
    route: ImageRoutes,
  },
  {
    path: '/schedule',
    route: ScheduleRoutes,
  },
  {
    path: '/settings',
    route: SettingsRoutes,
  },
  {
    path: '/ai',
    route: AIRoutes,
  },
  {
    path: '/videos',
    route: VideoRoutes,
  },

  {
    path: '/oauth',
    route: OAuthRoutes,
  },
  {
    path: '/oauth/social',
    route: SocialMediaOAuthRoutes,
  },
  {
    path: '/search',
    route: SearchRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
