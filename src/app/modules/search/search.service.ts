import { Post } from '../mongo-posts/mongo-posts.model';
import { Video } from '../video/video.model';
import { Image } from '../image/image.model';
import { User } from '../auth/auth.model';
import { SearchQuery, SearchResult, SearchResponse } from './search.interface';

class SearchService {
  async globalSearch(searchQuery: SearchQuery): Promise<SearchResponse> {
    const { query, type = 'all', limit = 10, offset = 0 } = searchQuery;
    
    if (!query || query.trim().length === 0) {
      return {
        results: [],
        total: 0,
        hasMore: false,
      };
    }

    const searchRegex = new RegExp(query, 'i');
    const results: SearchResult[] = [];

    // Search posts
    if (type === 'all' || type === 'post') {
      const posts = await Post.find({
        $or: [
          { caption: searchRegex },
          { hashtags: { $in: [searchRegex] } },
        ],
        isDeleted: false,
      })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 })
        .lean();

      posts.forEach((post) => {
        results.push({
          id: post._id.toString(),
          type: 'post',
          title: post.caption?.substring(0, 50) || 'Untitled Post',
          description: post.caption?.substring(0, 150) + '...',
          thumbnail: post.image_url,
          url: `/posts/${post._id}`,
          createdAt: post.createdAt || new Date(),
        });
      });
    }

    // Search videos
    if (type === 'all' || type === 'video') {
      const videos = await Video.find({
        $or: [
          { caption: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { hashtags: { $in: [searchRegex] } },
        ],
        isDeleted: false,
      })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 })
        .lean();

      videos.forEach((video) => {
        results.push({
          id: video._id.toString(),
          type: 'video',
          title: video.caption || video.originalName || 'Untitled Video',
          description: video.description?.substring(0, 150) + '...',
          thumbnail: video.thumbnail,
          url: `/videos/${video._id}`,
          createdAt: video.createdAt || new Date(),
        });
      });
    }

    // Search images
    if (type === 'all' || type === 'image') {
      const images = await Image.find({
        $or: [
          { original_filename: searchRegex },
          { filename: searchRegex },
        ],
      })
        .limit(limit)
        .skip(offset)
        .sort({ uploaded_at: -1 })
        .lean();

      images.forEach((image) => {
        results.push({
          id: image._id.toString(),
          type: 'image',
          title: image.original_filename || 'Untitled Image',
          description: `${image.mime_type} • ${Math.round(image.file_size / 1024)}KB`,
          thumbnail: image.file_path,
          url: `/images/${image._id}`,
          createdAt: image.uploaded_at || new Date(),
        });
      });
    }

    // Search users (if needed)
    if (type === 'all' || type === 'user') {
      const users = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 })
        .lean();

      users.forEach((user) => {
        results.push({
          id: user._id.toString(),
          type: 'user',
          title: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          description: user.email,
          thumbnail: user.profilePicture,
          url: `/users/${user._id}`,
          createdAt: user.createdAt || new Date(),
        });
      });
    }

    // Sort results by relevance and date
    results.sort((a, b) => {
      // Simple relevance scoring based on title match
      const aScore = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
      const bScore = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const limitedResults = results.slice(0, limit);
    
    return {
      results: limitedResults,
      total: results.length,
      hasMore: results.length > limit,
    };
  }

  async getPopularSearches(): Promise<SearchResult[]> {
    // Get recent popular posts and videos
    const recentPosts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const recentVideos = await Video.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    const popularResults: SearchResult[] = [];

    recentPosts.forEach((post) => {
      popularResults.push({
        id: post._id.toString(),
        type: 'post',
        title: post.caption?.substring(0, 50) || 'Untitled Post',
        description: post.caption?.substring(0, 100) + '...',
        thumbnail: post.image_url,
        url: `/posts/${post._id}`,
        createdAt: post.createdAt || new Date(),
      });
    });

    recentVideos.forEach((video) => {
      popularResults.push({
        id: video._id.toString(),
        type: 'video',
        title: video.caption || video.originalName || 'Untitled Video',
        description: video.description?.substring(0, 100) + '...',
        thumbnail: video.thumbnail,
        url: `/videos/${video._id}`,
        createdAt: video.createdAt || new Date(),
      });
    });

    return popularResults;
  }
}

export default new SearchService();