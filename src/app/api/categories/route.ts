import { NextResponse } from 'next/server';
import { gvDb } from '@/lib/database';

export async function GET() {
  try {
    const categories = gvDb.getCategories();
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
