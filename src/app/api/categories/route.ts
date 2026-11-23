import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { extractAuth } from '@/lib/security/middleware';
import { getSortedCategoriesByAffinity } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = extractAuth(req);
    const userId = auth?.userId;

    const { searchParams } = new URL(req.url);
    const mainCategoryParam = (searchParams.get('mainCategory') || searchParams.get('type') || '').toUpperCase();
    const mainCategory = (mainCategoryParam === 'VEG' || mainCategoryParam === 'NON_VEG') ? (mainCategoryParam as 'VEG' | 'NON_VEG') : undefined;

    const rawCategories = gvDb.getCategories(mainCategory);

    // If user is logged in, sort categories by their personal affinity
    // (most-played categories float to the top)
    const categories = getSortedCategoriesByAffinity(rawCategories, userId);

    const mainCategories = [
      {
        id: 'VEG',
        name: 'Veg Category',
        slug: 'veg',
        description: 'Family-friendly, all-ages, and casual browser games',
        badge: '🟢 VEG',
        count: rawCategories.reduce((sum, c) => sum + (c.vegCount || 0), 0),
      },
      {
        id: 'NON_VEG',
        name: 'Non-Veg Category',
        slug: 'non-veg',
        description: 'High-octane, intense action, combat, and mature games',
        badge: '🔴 NON-VEG',
        count: rawCategories.reduce((sum, c) => sum + (c.nonVegCount || 0), 0),
      },
    ];

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
      mainCategories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch categories: ${err.message}` },
      { status: 500 }
    );
  }
}
