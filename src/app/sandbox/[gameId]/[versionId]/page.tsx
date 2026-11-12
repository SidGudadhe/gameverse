import { redirect } from 'next/navigation';

export default function SandboxRedirectPage({
  params,
}: {
  params: { gameId: string; versionId: string };
}) {
  redirect(`/api/sandbox/files/${params.gameId}/${params.versionId}/index.html`);
}
