import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Users, Send, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

export default function CommunityPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/community/posts');
      setPosts(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load the community wall');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.post('/community/posts', { content: content.trim() });
      setContent('');
      toast.success('Posted to the Mohalla wall!');
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-clay/15 pb-4">
        <h1 className="font-display text-3xl text-indigo flex items-center gap-2">
          <Users className="w-7 h-7 text-clay" /> Mohalla Community Wall
        </h1>
        <p className="text-sm text-indigo/70">
          Connect with local buyers, share craft stories, and organize Bachat Group Deals.
        </p>
      </div>

      {/* Composer */}
      <form
        onSubmit={handlePost}
        className="bg-warmwhite foil-border shadow-warm rounded-2xl p-4 md:p-5 space-y-3"
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-clay/15 text-clay flex items-center justify-center font-bold shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a craft story, a Bachat deal, or introduce your shop..."
            rows={2}
            maxLength={500}
            className="flex-1 resize-none bg-ivory/60 border border-clay/15 rounded-xl px-3 py-2 text-sm text-indigo placeholder:text-indigo/40 focus:outline-none focus:ring-2 focus:ring-clay/40 transition-all"
          />
        </div>
        <div className="flex items-center justify-between pl-[52px]">
          <span className="text-xs text-indigo/40">{content.length}/500</span>
          <button
            type="submit"
            disabled={!content.trim() || posting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-clay hover:bg-saffron disabled:opacity-40 disabled:cursor-not-allowed text-warmwhite text-sm font-semibold transition-all shadow-warm"
          >
            <Send className="w-3.5 h-3.5" /> {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>

      {/* Feed — pinboard style, varied card widths */}
      {loading ? (
        <p className="text-sm text-indigo/50 text-center py-8">Loading the wall...</p>
      ) : posts.length === 0 ? (
        <EmptyState
          variant="community"
          title="Your Neighborhood Wall is Quiet"
          description="Be the first to share a post or introduce your local shop to the community!"
        />
      ) : (
        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="break-inside-avoid bg-warmwhite rounded-2xl p-5 shadow-warm border border-clay/10 relative"
            >
              {/* pin detail */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-marigold shadow-warm" />

              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-clay/15 text-clay flex items-center justify-center font-bold text-xs">
                  {post.userName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo leading-none">{post.userName || 'Mohalla Member'}</p>
                  <p className="text-[11px] text-indigo/40 mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              <p className="text-sm text-indigo/85 leading-relaxed">{post.content}</p>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-clay/10">
                <button className="flex items-center gap-1.5 text-xs text-indigo/60 hover:text-saffron transition-colors">
                  <Heart className="w-3.5 h-3.5" /> {post.likesCount || 0}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-indigo/60 hover:text-clay transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Comment
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bachat group-buy teaser — placeholder module hook per design brief */}
      <div className="bg-neem/10 border border-neem/20 rounded-2xl p-5 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-neem shrink-0" />
        <p className="text-sm text-indigo/80">
          <span className="font-semibold text-neem">Bachat Group Deals</span> — pool orders with
          neighbours for bulk discounts. Coming soon to this wall.
        </p>
      </div>
    </div>
  );
}
