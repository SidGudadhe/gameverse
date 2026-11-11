import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, extractAuth } from '../../../../lib/security/middleware';
import { gvDb } from '../../../../lib/database';
import { validateUsername } from '../../../../lib/community';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get('username');

    // Public lookup by handle
    if (queryUsername) {
      const clean = queryUsername.trim().replace(/^@/, '');
      const profile = gvDb.getProfileByUsername(clean);

      if (!profile) {
        return NextResponse.json({ error: `Player @${clean} not found` }, { status: 404 });
      }

      const favorites = gvDb.getFavoritesByUser(profile.userId);
      const favoriteGames = gvDb.getFavoriteGames(profile.userId);
      const history = gvDb.getPlayHistory(profile.userId, 10);

      return NextResponse.json({
        success: true,
        profile: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          favoriteGenre: profile.favoriteGenre,
          createdAt: profile.createdAt || new Date().toISOString(),
        },
        stats: {
          favoritesCount: favorites.length,
          gamesPlayedCount: history.length,
        },
        favoriteGames: favoriteGames.slice(0, 6),
      });
    }

    // Authenticated user private profile
    const authUser = extractAuth(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    let profile = gvDb.getProfileByUserId(authUser.userId);
    if (!profile) {
      const user = gvDb.findUserById(authUser.userId);
      profile = gvDb.updateProfile(authUser.userId, {
        displayName: user?.name || 'Player',
        username: `player_${authUser.userId.substring(authUser.userId.length - 6)}`,
      });
    }

    const favorites = gvDb.getFavoritesByUser(authUser.userId);
    const history = gvDb.getPlayHistory(authUser.userId, 10);

    return NextResponse.json({
      success: true,
      profile,
      stats: {
        favoritesCount: favorites.length,
        gamesPlayedCount: history.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching player profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { username, displayName, avatarUrl, bio, favoriteGenre } = body;

    const updates: Record<string, any> = {};

    if (username !== undefined) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
      }

      const available = gvDb.isUsernameAvailable(validation.cleanUsername!, user!.userId);
      if (!available) {
        return NextResponse.json(
          { error: `The handle @${validation.cleanUsername} is already taken.` },
          { status: 409 }
        );
      }

      updates.username = validation.cleanUsername;
    }

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json({ error: 'Display name must be at least 2 characters.' }, { status: 400 });
      }
      updates.displayName = displayName.trim();
    }

    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (bio !== undefined) updates.bio = bio.slice(0, 250);
    if (favoriteGenre !== undefined) updates.favoriteGenre = favoriteGenre;

    const updatedProfile = gvDb.updateProfile(user!.userId, updates);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error('Error updating player profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
