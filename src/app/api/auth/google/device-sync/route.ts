import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import os from 'os';

export interface DeviceGoogleAccount {
  email: string;
  name: string;
  avatarUrl: string;
  avatarBg: string;
  initials: string;
  isDeviceDefault: boolean;
}

export async function GET(req: NextRequest) {
  const accounts: DeviceGoogleAccount[] = [];

  // 1. Detect user identity from machine's environment and git configuration
  let detectedEmail = '';
  let detectedName = '';

  try {
    const gitEmail = execSync('git config user.email', { encoding: 'utf8', timeout: 1500 }).trim();
    if (gitEmail && gitEmail.includes('@')) {
      detectedEmail = gitEmail;
    }
  } catch {}

  try {
    const gitName = execSync('git config user.name', { encoding: 'utf8', timeout: 1500 }).trim();
    if (gitName) {
      detectedName = gitName === 'SidGudadhe' ? 'Sid Gudadhe' : gitName;
    }
  } catch {}

  // Fallback to system username if name wasn't detected
  if (!detectedName) {
    try {
      const sysUser = os.userInfo().username;
      if (sysUser && sysUser.toLowerCase() !== 'user') {
        detectedName = sysUser.charAt(0).toUpperCase() + sysUser.slice(1);
      }
    } catch {}
  }

  // If detected on this device (e.g. sidprojects96@gmail.com / Sid Gudadhe)
  if (detectedEmail) {
    const initials = (detectedName || detectedEmail.split('@')[0])
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    accounts.push({
      email: detectedEmail.toLowerCase(),
      name: detectedName || detectedEmail.split('@')[0],
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(detectedEmail)}`,
      avatarBg: 'bg-gradient-to-tr from-[#4285F4] to-[#34A853]',
      initials,
      isDeviceDefault: true,
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return NextResponse.json({
    success: true,
    hasLiveGoogleClient: !!clientId,
    clientId: clientId ? clientId.substring(0, 8) + '...' : null,
    deviceAccounts: accounts,
  });
}
