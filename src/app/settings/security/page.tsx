import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SecurityPageClient from './SecurityPageClient';

export default async function SecuritySettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { mfaEnabled: true },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">セキュリティ設定</h1>
      <SecurityPageClient isMfaEnabled={user.mfaEnabled} />
    </div>
  );
}
