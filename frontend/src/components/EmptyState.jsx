import React from 'react';
import { ShoppingBag, PackageOpen, Users, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  variant = 'default',
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) {
  const getVariantDetails = () => {
    switch (variant) {
      case 'cart':
        return {
          icon: <ShoppingBag className="w-12 h-12 text-clay stroke-[1.5]" />,
          defaultTitle: 'Your Basket is Waiting to be Filled',
          defaultDesc: 'Explore handcrafted goods, spices, and artisan products directly from your Mohalla sellers.',
          cta: 'Discover Local Products',
          link: '/',
        };
      case 'orders':
        return {
          icon: <PackageOpen className="w-12 h-12 text-marigold stroke-[1.5]" />,
          defaultTitle: 'No Neighborhood Orders Yet',
          defaultDesc: 'When you purchase from local artisans, your OTP-protected order history will appear right here.',
          cta: 'Browse Marketplace',
          link: '/',
        };
      case 'community':
        return {
          icon: <Users className="w-12 h-12 text-neem stroke-[1.5]" />,
          defaultTitle: 'Your Neighborhood Wall is Quiet',
          defaultDesc: 'Be the first to introduce your local shop, share craft stories, or organize a Bachat Group Deal.',
          cta: 'Share a Community Post',
          link: '/community',
        };
      case 'search':
        return {
          icon: <Search className="w-12 h-12 text-saffron stroke-[1.5]" />,
          defaultTitle: 'No Local Treasures Found',
          defaultDesc: 'Try searching for artisan pottery, Sheesham wood, organic honey, or local seller names.',
          cta: 'Clear Search',
          link: '/',
        };
      default:
        return {
          icon: <Sparkles className="w-12 h-12 text-clay stroke-[1.5]" />,
          defaultTitle: 'Nothing Here Yet',
          defaultDesc: 'Check back soon for new local updates and handcrafted additions.',
          cta: 'Go to Home',
          link: '/',
        };
    }
  };

  const config = getVariantDetails();
  const displayTitle = title || config.defaultTitle;
  const displayDesc = description || config.defaultDesc;
  const displayCta = actionText || config.cta;
  const displayLink = actionLink || config.link;

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center max-w-md mx-auto my-8 rounded-2xl bg-warmwhite foil-border shadow-warm jali-bg space-y-4">
      <div className="p-4 rounded-full bg-ivory shadow-warm border border-clay/10">
        {config.icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-display text-indigo">{displayTitle}</h3>
        <p className="text-sm text-indigo/70 leading-relaxed">{displayDesc}</p>
      </div>

      {onAction ? (
        <button
          onClick={onAction}
          className="mt-2 px-6 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-medium text-sm transition-all shadow-warm"
        >
          {displayCta}
        </button>
      ) : displayLink ? (
        <Link
          to={displayLink}
          className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-clay hover:bg-saffron text-warmwhite font-medium text-sm transition-all shadow-warm"
        >
          {displayCta}
        </Link>
      ) : null}
    </div>
  );
}
