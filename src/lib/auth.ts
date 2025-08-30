import 'server-only';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from './jwt';
import { prisma } from './prisma';
import type { SessionUser, UserRole } from '@/types';

/**
 * サーバーサイドで現在のユーザーセッションを取得する
 * @returns ログインしているユーザーの情報、またはnull
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('refreshToken')?.value;
  if (!token) return null;

  try {
    // 1. トークンを検証・デコード
    const payload = await verifyRefreshToken(token);
    if (!payload || !payload.sub) return null;

    // 2. DBのリフレッシュトークンが無効化されていないか確認
    if (payload.jti) {
        const dbToken = await prisma.refreshToken.findUnique({
            where: { jti: payload.jti }
        });
        if (!dbToken || dbToken.revoked) return null;
    }

    // 3. ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    // 4. セッションオブジェクトを構築して返す (jtiも追加)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.userRoles.map((userRole: UserRole) => userRole.role.name),
      jti: payload.jti as string | undefined,
    };
  } catch (error) {
    console.error('セッションの取得に失敗しました:', error);
    return null;
  }
}

