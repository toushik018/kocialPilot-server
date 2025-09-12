import express from 'express';
import { SearchController } from './search.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../auth/auth.constant';

const router = express.Router();

// Global search endpoint
router.get(
  '/global',
  auth(USER_ROLE.user, USER_ROLE.admin),
  SearchController.globalSearch
);

// Get search suggestions
router.get(
  '/suggestions',
  auth(USER_ROLE.user, USER_ROLE.admin),
  SearchController.getSuggestions
);

// Get popular searches
router.get(
  '/popular',
  auth(USER_ROLE.user, USER_ROLE.admin),
  SearchController.getPopularSearches
);

export const SearchRoutes = router;