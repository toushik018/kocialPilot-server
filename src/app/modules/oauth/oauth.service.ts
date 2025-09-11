import axios from 'axios';
import config from '../../config';
import AppError from '../../error/AppError';
import { StatusCodes } from 'http-status-codes';

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface SocialMediaProfile {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  platform: string;
}

class OAuthService {
  // Facebook OAuth
  static getFacebookAuthUrl(): string {
    const { app_id, redirect_uri } = config.oauth.facebook;
    const scope =
      'email,public_profile,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';

    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${app_id}&redirect_uri=${encodeURIComponent(redirect_uri!)}&scope=${scope}&response_type=code`;
  }

  static async exchangeFacebookCode(code: string): Promise<OAuthTokenResponse> {
    const { app_id, app_secret, redirect_uri } = config.oauth.facebook;

    try {
      const response = await axios.get(
        'https://graph.facebook.com/v18.0/oauth/access_token',
        {
          params: {
            client_id: app_id,
            client_secret: app_secret,
            redirect_uri,
            code,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Facebook OAuth error: ${responseError || errorMessage}`
      );
    }
  }

  static async getFacebookProfile(
    accessToken: string
  ): Promise<SocialMediaProfile> {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        picture: response.data.picture?.data?.url,
        platform: 'facebook',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Failed to fetch Facebook profile: ${responseError || errorMessage}`
      );
    }
  }

  // Instagram OAuth (uses Facebook)
  static getInstagramAuthUrl(): string {
    const { app_id, redirect_uri } = config.oauth.instagram;
    const scope = 'instagram_basic,instagram_content_publish';

    return `https://api.instagram.com/oauth/authorize?client_id=${app_id}&redirect_uri=${encodeURIComponent(redirect_uri!)}&scope=${scope}&response_type=code`;
  }

  static async exchangeInstagramCode(
    code: string
  ): Promise<OAuthTokenResponse> {
    const { app_id, app_secret, redirect_uri } = config.oauth.instagram;

    try {
      const response = await axios.post(
        'https://api.instagram.com/oauth/access_token',
        {
          client_id: app_id,
          client_secret: app_secret,
          grant_type: 'authorization_code',
          redirect_uri,
          code,
        }
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error_message?: string } } })
              .response?.data?.error_message
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Instagram OAuth error: ${responseError || errorMessage}`
      );
    }
  }

  static async getInstagramProfile(
    accessToken: string
  ): Promise<SocialMediaProfile> {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username',
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        name: response.data.username,
        platform: 'instagram',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (
              error as {
                response?: { data?: { error?: { message?: string } } };
              }
            ).response?.data?.error?.message
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Failed to fetch Instagram profile: ${responseError || errorMessage}`
      );
    }
  }

  // Twitter OAuth
  static getTwitterAuthUrl(): string {
    const { client_id, redirect_uri } = config.oauth.twitter;
    const scope = 'tweet.read tweet.write users.read offline.access';

    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri!)}&scope=${encodeURIComponent(scope)}&state=state&code_challenge=challenge&code_challenge_method=plain`;
  }

  static async exchangeTwitterCode(code: string): Promise<OAuthTokenResponse> {
    const { client_id, client_secret, redirect_uri } = config.oauth.twitter;

    try {
      const response = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        {
          grant_type: 'authorization_code',
          client_id,
          client_secret,
          redirect_uri,
          code,
          code_verifier: 'challenge',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error_description?: string } } })
              .response?.data?.error_description
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Twitter OAuth error: ${responseError || errorMessage}`
      );
    }
  }

  static async getTwitterProfile(
    accessToken: string
  ): Promise<SocialMediaProfile> {
    try {
      const response = await axios.get('https://api.twitter.com/2/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.data.id,
        name: response.data.data.name,
        platform: 'twitter',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Failed to fetch Twitter profile: ${responseError || errorMessage}`
      );
    }
  }

  // LinkedIn OAuth
  static getLinkedInAuthUrl(): string {
    const { client_id, redirect_uri } = config.oauth.linkedin;
    const scope = 'r_liteprofile r_emailaddress w_member_social';

    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri!)}&scope=${encodeURIComponent(scope)}`;
  }

  static async exchangeLinkedInCode(code: string): Promise<OAuthTokenResponse> {
    const { client_id, client_secret, redirect_uri } = config.oauth.linkedin;

    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          client_id,
          client_secret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error_description?: string } } })
              .response?.data?.error_description
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `LinkedIn OAuth error: ${responseError || errorMessage}`
      );
    }
  }

  static async getLinkedInProfile(
    accessToken: string
  ): Promise<SocialMediaProfile> {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const firstName = response.data.localizedFirstName;
      const lastName = response.data.localizedLastName;

      return {
        id: response.data.id,
        name: `${firstName} ${lastName}`,
        platform: 'linkedin',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const responseError =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Failed to fetch LinkedIn profile: ${responseError || errorMessage}`
      );
    }
  }
}

export { OAuthService, SocialMediaProfile, OAuthTokenResponse };
