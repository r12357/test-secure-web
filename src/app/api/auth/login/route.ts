import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { generateAccessToken, generateRefreshToken, generateMfaToken } from '@/lib/jwt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const LoginSchema = z.object({
  email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
  password: z.string().min(1, { message: 'パスワードを入力してください。' }),
});

// const MAX_LOGIN_ATTEMPTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: '入力内容が無効です。', details: validation.error.flatten() }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 });
    }
    if (user.isLocked) {
      return NextResponse.json({ error: 'アカウントがロックされています。' }, { status: 403 });
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      // ... ログイン失敗処理 (変更なし)
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 });
    }

    // --- ここからMFAが有効な場合の処理を修正 ---
    if (user.mfaEnabled) {
      const mfaToken = await generateMfaToken({ sub: user.id });
      // サーバー側でトークンが生成されたかを確認するログ
      console.log('🔑 MFA Token generated on server:', mfaToken); 
      return NextResponse.json({ mfaRequired: true, mfaToken: mfaToken });
    }
    // --- ここまで ---

    // MFAが無効な場合の通常のログイン処理
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0 } });
    
    const jti = uuidv4();
    const payload = { sub: user.id, email: user.email };
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken({ ...payload, jti });
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
    return NextResponse.json({ error: 'サーバー内部でエラーが発生しました。' }, { status: 500 });
  }
}

