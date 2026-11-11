import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category') || undefined;
    const searchQuery = (searchParams.get('search') || searchParams.get('q') || '').toLowerCase().trim();
    const engineQuery = searchParams.get('engine') || undefined;
    const orientationQuery = searchParams.get('orientation') || undefined;
    const sortParam = searchParams.get('sort') || 'trending';
    const featuredParam = searchParams.get('featured');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    // Only return PUBLISHED games to the public catalog
    let games = gvDb.getGames({ status: 'PUBLISHED' });

    // Category filter (match by id or slug)
    if (categoryQuery && categoryQuery !== 'all') {
      const category = gvDb.getCategoryBySlug(categoryQuery);
      const targetCatId = category ? category.id : categoryQuery;
      games = games.filter(
        (g) =>
          g.categoryId === targetCatId ||
          g.categoryName?.toLowerCase() === categoryQuery.toLowerCase()
      );
    }

    // Search query filter (matches title, description, or studio)
    if (searchQuery) {
      games = games.filter(
        (g) =>
          g.title.toLowerCase().includes(searchQuery) ||
          g.shortDescription.toLowerCase().includes(searchQuery) ||
          g.developerName.toLowerCase().includes(searchQuery)
      );
    }

    // Engine filter
    if (engineQuery && engineQuery !== 'all') {
      games = games.filter((g) => g.engine.toLowerCase().includes(engineQuery.toLowerCase()));
    }

    // Orientation filter
    if (orientationQuery && orientationQuery !== 'all') {
      games = games.filter((g) => g.orientation === orientationQuery || g.orientation === 'ANY');
    }

    // Featured filter
    if (featuredParam === 'true') {
      games = games.filter((g) => g.isFeatured);
    }

    // Sorting algorithm
    if (sortParam === 'popular') {
      games.sort((a, b) => b.totalPlays - a.totalPlays);
    } else if (sortParam === 'top_rated') {
      games.sort((a, b) => b.rating - a.rating);
    } else if (sortParam === 'newest') {
      games.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      );
    } else {
      // Default: 'trending' engagement score
      games.sort((a, b) => {
        const scoreA = (a.totalPlays || 0) * 0.5 + (a.rating || 0) * 1000;
        const scoreB = (b.totalPlays || 0) * 0.5 + (b.rating || 0) * 1000;
        return scoreB - scoreA;
      });
    }

    const total = games.length;
    const paginated = games.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      count: paginated.length,
      total,
      offset,
      limit,
      games: paginated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch public games catalog: ${err.message}` },
      { status: 500 }
    );
  }
}
