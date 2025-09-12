import axios from 'axios';
import { SocialMediaAccount } from './social-media.model';
import { ISocialMediaAccount } from './social-media.interface';

interface OAuthState {
  userId: string;
  platform: string;
  timestamp: number;
}

interface OAuthResult {
  success: boolean;
  error?: string;
  account?: ISocialMediaAccount;
}

export class OAuthService {
  private static generateState(userId: string, platform: string): string {
    const state: OAuthState = {
      userId,
      platform,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(state)).toString('base64');
  }

  private static parseState(stateString: string): OAuthState | null {
    try {
      const decoded = Buffer.from(stateString, 'base64').toString('utf-8');
      const state: OAuthState = JSON.parse(decoded);
      
      // Check if state is not older than 10 minutes
      if (Date.now() - state.timestamp > 10 * 60 * 1000) {
        return null;
      }
      
      return state;
    } catch {
      return null;
    }
  }

  // Facebook OAuth
  static getFacebookAuthUrl(userId: string): string {
    const state = this.generateState(userId, 'facebook');
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
      scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  static async handleFacebookCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      const parsedState = this.parseState(state);
      if (!parsedState || parsedState.platform !== 'facebook') {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
          code,
        },
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://graph.facebook.com/me', {
        params: {
          access_token,
          fields: 'id,name,picture',
        },
      });

      const { id, name } = userResponse.data;

      // Save or update account
      const existingAccount = await SocialMediaAccount.findOne({
        owner: parsedState.userId,
        platform: 'facebook',
        accountId: id,
      });

      let account: ISocialMediaAccount;
      if (existingAccount) {
        account = await SocialMediaAccount.findByIdAndUpdate(
          existingAccount._id,
          {
            accessToken: access_token,
            isConnected: true,
            accountName: name,
          },
          { new: true }
        ) as ISocialMediaAccount;
      } else {
        account = await SocialMediaAccount.create({
          platform: 'facebook',
          accountName: name,
          accountId: id,
          accessToken: access_token,
          isConnected: true,
          owner: parsedState.userId,
        });
      }

      return { success: true, account };
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      return { success: false, error: 'Failed to authenticate with Facebook' };
    }
  }

  // Instagram OAuth (uses Facebook)
  static getInstagramAuthUrl(userId: string): string {
    const state = this.generateState(userId, 'instagram');
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      scope: 'instagram_basic,instagram_content_publish',
      response_type: 'code',
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  static async handleInstagramCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      const parsedState = this.parseState(state);
      if (!parsedState || parsedState.platform !== 'instagram') {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for access token
      const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
        params: {
          client_id: process.env.INSTAGRAM_APP_ID,
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code,
        },
      });

      const { access_token } = tokenResponse.data;

      // Get Instagram business accounts
      const accountsResponse = await axios.get('https://graph.facebook.com/me/accounts', {
        params: {
          access_token,
          fields: 'instagram_business_account',
        },
      });

      const accounts = accountsResponse.data.data;
      if (!accounts || accounts.length === 0) {
        return { success: false, error: 'No Instagram business accounts found' };
      }

      // Use the first Instagram business account
      const instagramAccountId = accounts[0].instagram_business_account?.id;
      if (!instagramAccountId) {
        return { success: false, error: 'No Instagram business account linked' };
      }

      // Get Instagram account info
      const instagramResponse = await axios.get(`https://graph.facebook.com/${instagramAccountId}`, {
        params: {
          access_token,
          fields: 'id,username,profile_picture_url',
        },
      });

      const { id, username } = instagramResponse.data;

      // Save or update account
      const existingAccount = await SocialMediaAccount.findOne({
        owner: parsedState.userId,
        platform: 'instagram',
        accountId: id,
      });

      let account: ISocialMediaAccount;
      if (existingAccount) {
        account = await SocialMediaAccount.findByIdAndUpdate(
          existingAccount._id,
          {
            accessToken: access_token,
            isConnected: true,
            accountName: username,
          },
          { new: true }
        ) as ISocialMediaAccount;
      } else {
        account = await SocialMediaAccount.create({
          platform: 'instagram',
          accountName: username,
          accountId: id,
          accessToken: access_token,
          isConnected: true,
          owner: parsedState.userId,
        });
      }

      return { success: true, account };
    } catch (error) {
      console.error('Instagram OAuth error:', error);
      return { success: false, error: 'Failed to authenticate with Instagram' };
    }
  }

  // Twitter OAuth
  static getTwitterAuthUrl(userId: string): string {
    const state = this.generateState(userId, 'twitter');
    const params = new URLSearchParams({
      client_id: process.env.TWITTER_CLIENT_ID!,
      redirect_uri: process.env.TWITTER_REDIRECT_URI!,
      scope: 'tweet.read tweet.write users.read offline.access',
      response_type: 'code',
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  static async handleTwitterCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      const parsedState = this.parseState(state);
      if (!parsedState || parsedState.platform !== 'twitter') {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for access token
      const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
        client_id: process.env.TWITTER_CLIENT_ID,
        client_secret: process.env.TWITTER_CLIENT_SECRET,
        redirect_uri: process.env.TWITTER_REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
        code_verifier: 'challenge',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          'user.fields': 'id,name,username,profile_image_url',
        },
      });

      const { id, username } = userResponse.data.data;

      // Save or update account
      const existingAccount = await SocialMediaAccount.findOne({
        owner: parsedState.userId,
        platform: 'twitter',
        accountId: id,
      });

      let account: ISocialMediaAccount;
      if (existingAccount) {
        account = await SocialMediaAccount.findByIdAndUpdate(
          existingAccount._id,
          {
            accessToken: access_token,
            refreshToken: refresh_token,
            isConnected: true,
            accountName: username,
          },
          { new: true }
        ) as ISocialMediaAccount;
      } else {
        account = await SocialMediaAccount.create({
          platform: 'twitter',
          accountName: username,
          accountId: id,
          accessToken: access_token,
          refreshToken: refresh_token,
          isConnected: true,
          owner: parsedState.userId,
        });
      }

      return { success: true, account };
    } catch (error) {
      console.error('Twitter OAuth error:', error);
      return { success: false, error: 'Failed to authenticate with Twitter' };
    }
  }

  // LinkedIn OAuth
  static getLinkedInAuthUrl(userId: string): string {
    const state = this.generateState(userId, 'linkedin');
    const params = new URLSearchParams({
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      scope: 'w_member_social',
      response_type: 'code',
      state,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  static async handleLinkedInCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      const parsedState = this.parseState(state);
      if (!parsedState || parsedState.platform !== 'linkedin') {
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange code for access token
      const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        },
      });

      const { id, firstName, lastName } = userResponse.data;
      const name = `${firstName.localized.en_US} ${lastName.localized.en_US}`;

      // Save or update account
      const existingAccount = await SocialMediaAccount.findOne({
        owner: parsedState.userId,
        platform: 'linkedin',
        accountId: id,
      });

      let account: ISocialMediaAccount;
      if (existingAccount) {
        account = await SocialMediaAccount.findByIdAndUpdate(
          existingAccount._id,
          {
            accessToken: access_token,
            isConnected: true,
            accountName: name,
          },
          { new: true }
        ) as ISocialMediaAccount;
      } else {
        account = await SocialMediaAccount.create({
          platform: 'linkedin',
          accountName: name,
          accountId: id,
          accessToken: access_token,
          isConnected: true,
          owner: parsedState.userId,
        });
      }

      return { success: true, account };
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      return { success: false, error: 'Failed to authenticate with LinkedIn' };
    }
  }

  // Get connected accounts for user
  static async getConnectedAccounts(userId: string): Promise<ISocialMediaAccount[]> {
    return await SocialMediaAccount.find({
      owner: userId,
      isConnected: true,
    }).select('-accessToken -refreshToken');
  }

  // Disconnect account
  static async disconnectAccount(accountId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const account = await SocialMediaAccount.findOne({
        _id: accountId,
        owner: userId,
      });

      if (!account) {
        return { success: false, message: 'Account not found' };
      }

      await SocialMediaAccount.findByIdAndUpdate(accountId, {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
      });

      return { success: true, message: 'Account disconnected successfully' };
    } catch (error) {
      console.error('Disconnect account error:', error);
      return { success: false, message: 'Failed to disconnect account' };
    }
  }
}