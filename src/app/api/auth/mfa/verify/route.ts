import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticator } from 'otplib';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyMfaToken,
} from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const MfaVerifySchema = z.object({
  mfaToken: z.string(),
  code: z.string().length(6, '6桁のコードを入力してください。'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = MfaVerifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: '入力が無効です。' }, { status: 400 });
    }

    const { mfaToken, code } = validation.data;

    // --- ↓ デバッグ用のログを追加 ↓ ---
    console.log('📬 Received MFA token at API:', mfaToken);
    // --- ↑ デバッグ用のログを追加 ↑ ---

    // 1. 一時トークンを検証
    const payload = await verifyMfaToken(mfaToken);
    if (!payload || !payload.sub) {
      return NextResponse.json({ error: 'セッションが無効か、有効期限が切れています。再度ログインしてください。' }, { status: 401 });
    }
    const userId = payload.sub as string;

    // 2. ユーザーとTOTPシークレットを取得
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const secretRecord = await prisma.tOTPSecret.findFirst({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!user || !secretRecord) {
      return NextResponse.json({ error: '認証情報が見つかりません。' }, { status: 401 });
    }

    // 3. 6桁のコードを検証
    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({
      token: code,
      secret: secretRecord.secret,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'コードが正しくありません。' }, { status: 401 });
    }

    // 4. 検証成功後、本番のトークンを発行
    const jti = uuidv4();
    const finalPayload = { sub: user.id, email: user.email };
    const accessToken = await generateAccessToken(finalPayload);
    const refreshToken = await generateRefreshToken({ ...finalPayload, jti });
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { jti, userId: user.id, expiresAt: refreshTokenExpiresAt },
    });

    const response = NextResponse.json({ accessToken });
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: refreshTokenExpiresAt,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

