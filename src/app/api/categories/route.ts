import { NextRequest, NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';
import { extractAuth } from '@/lib/security/middleware';
import { getSortedCategoriesByAffinity } from '@/lib/recommendations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = extractAuth(req);
    const userId = auth?.userId;

    const rawCategories = gvDb.getCategories();

    // If user is logged in, sort categories by their personal affinity
    // (most-played categories float to the top)
    const categories = getSortedCategoriesByAffinity(rawCategories, userId);

    return NextResponse.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch categories: ${err.message}` },
      { status: 500 }
    );
  }
}
