import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/middleware';
import { gvDb } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  let profile = gvDb.getProfileByUserId(user!.userId);
  const agreement = gvDb.getAgreementByUserId(user!.userId);
  const dbUser = gvDb.findUserById(user!.userId);
  const settings = gvDb.getDeveloperSettings(user!.userId);

  // If profile doesn't exist, build real profile from user account data
  if (!profile && dbUser) {
    profile = gvDb.updateProfile(dbUser.id, {
      displayName: dbUser.name,
      studioName: dbUser.name,
      username: dbUser.email
        ? dbUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
        : `studio_${Date.now()}`,
    });
  }

  // Count real titles in catalog by this creator
  const titles = gvDb.state.games ? gvDb.state.games.filter((g) => g.creatorId === user!.userId) : [];

  const profilePayload = {
    studioName: profile?.studioName || dbUser?.name || '',
    displayName: profile?.displayName || dbUser?.name || '',
    username: profile?.username || (dbUser?.email ? dbUser.email.split('@')[0] : 'studio'),
    email: dbUser?.email || user?.email || '',
    website: profile?.website || '',
    portfolioUrl: profile?.portfolioUrl || '',
    bio: profile?.bio || '',
    avatarUrl: profile?.avatarUrl || '',
    createdAt: dbUser?.createdAt || profile?.createdAt || '',
    updatedAt: profile?.updatedAt || '',
  };

  const agreementPayload = agreement
    ? {
        id: agreement.id,
        agreementVersion: agreement.agreementVersion,
        accountStatus: agreement.accountStatus,
        acceptedAt: agreement.acceptedAt,
      }
    : null;

  return NextResponse.json({
    success: true,
    profile: profilePayload,
    user: dbUser
      ? {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          createdAt: dbUser.createdAt,
          emailVerified: dbUser.emailVerified,
        }
      : null,
    agreement: agreementPayload,
    studioVerified: settings?.studioVerified ?? true,
    totalTitles: titles.length,
    data: {
      profile: profilePayload,
      agreement: agreementPayload,
    },
  });
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireRole(req, 'DEVELOPER');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { studioName, website, bio, portfolioUrl, displayName, username } = body;

    const trimmedStudio = studioName !== undefined ? studioName.trim() : undefined;
    const trimmedDisplay = displayName !== undefined ? displayName.trim() : undefined;
    const trimmedWeb = website !== undefined ? website.trim() : undefined;
    const trimmedPort = portfolioUrl !== undefined ? portfolioUrl.trim() : undefined;
    const trimmedBio = bio !== undefined ? bio.trim() : undefined;
    const trimmedUser = username !== undefined ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined;

    // Validate username uniqueness if changed
    if (trimmedUser) {
      const isAvailable = gvDb.isUsernameAvailable(trimmedUser, user!.userId);
      if (!isAvailable) {
        return NextResponse.json(
          { success: false, error: 'This studio username is already taken. Please choose another.' },
          { status: 400 }
        );
      }
    }

    const updated = gvDb.updateProfile(user!.userId, {
      ...(trimmedStudio ? { studioName: trimmedStudio } : {}),
      ...(trimmedDisplay ? { displayName: trimmedDisplay } : {}),
      ...(trimmedUser ? { username: trimmedUser } : {}),
      website: trimmedWeb || '',
      portfolioUrl: trimmedPort || '',
      bio: trimmedBio || '',
    });

    // Also keep User.name in sync
    if (trimmedStudio || trimmedDisplay) {
      gvDb.updateUser(user!.userId, {
        name: trimmedStudio || trimmedDisplay,
      });
    }

    gvDb.logAudit({
      actorId: user!.userId,
      actorName: user!.name,
      action: 'UPDATE_STUDIO_PROFILE',
      targetType: 'PROFILE',
      targetId: updated.id,
      details: { studioName: trimmedStudio, displayName: trimmedDisplay },
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Studio profile updated successfully.',
      profile: updated,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
