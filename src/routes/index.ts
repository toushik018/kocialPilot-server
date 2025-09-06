import { Router } from 'express';

import { AIRoutes } from '../app/modules/ai/ai.route';
import { AuthRoute } from '../app/modules/auth/auth.route';
import { DashboardRoutes } from '../app/modules/dashboard/dashboard.route';
import { ImageRoutes } from '../app/modules/image/image.route';
import { MongoPdfRoutes } from '../app/modules/mongo-pdf/mongo-pdf.route';
import { MongoPostRoutes } from '../app/modules/mongo-posts/mongo-posts.route';
import { ScheduleRoutes } from '../app/modules/schedule/schedule.route';
import { SocialMediaRoutes } from '../app/modules/social-media/social-media.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: AuthRoute,
  },
  {
    path: '/mongo-posts',
    route: MongoPostRoutes,
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
    path: '/ai',
    route: AIRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
