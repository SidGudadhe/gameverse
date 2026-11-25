import { redirect } from 'next/navigation';
import { gvDb } from '@/lib/database';

export default function SandboxRedirectPage({
  params,
}: {
  params: { gameId: string; versionId: string };
}) {
  const version = gvDb.getVersionById(params.versionId);
  const entryFile = (version?.entryFile || 'index.html').replace(/^\/+/, '');
  redirect(`/api/sandbox/files/${params.gameId}/${params.versionId}/${entryFile}`);
}
