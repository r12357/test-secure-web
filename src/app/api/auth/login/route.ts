import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { generateAccessToken, generateRefreshToken, generateMfaToken } from '@/lib/jwt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);


const LoginSchema = z.object({
  email: z.email({ message: '有効なメールアドレスを入力してください。' }),
  password: z.string().min(1, { message: 'パスワードを入力してください。' }),
});

const LOCKOUT_THRESHOLD = 5; // 5回失敗でロック
const INITIAL_LOCKOUT_MINUTES = 5; // 初回ロックは5分
const ESCALATED_LOCKOUT_MINUTES = 15; // 連続攻撃には15分ロック

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: '入力内容が無効です。' }, { status: 400 });
    }

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // ユーザーが存在しない場合でも、アカウントの存在を悟らせないようにする
    if (!user) {
      return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません。' }, { status: 401 });
    }

    if (user.lockedUntil && dayjs().isBefore(user.lockedUntil)) {
      const remainingTime = dayjs.duration(dayjs(user.lockedUntil).diff(dayjs())).format('m分s秒');
      return NextResponse.json({ error: `アカウントはロックされています。残り ${remainingTime}` }, { status: 403 });
    }
    // --- ここまで ---

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      // --- パスワード失敗時のロック処理 ---
      const newFailedCount = user.failedLoginCount + 1;
      let newLockedUntil: Date | null = null;
      let errorMessage = 'メールアドレスまたはパスワードが正しくありません。';

      if (newFailedCount >= LOCKOUT_THRESHOLD) {
        // 閾値を超えていて、前回のロックが解除された後の再試行なら、ロック時間を延長
        if (user.lockedUntil && dayjs().isAfter(user.lockedUntil)) {
          newLockedUntil = dayjs().add(ESCALATED_LOCKOUT_MINUTES, 'minute').toDate();
          const remainingTime = dayjs.duration(ESCALATED_LOCKOUT_MINUTES, 'minutes').format('m分');
          errorMessage = `試行回数が上限を超えました。アカウントは ${remainingTime} ロックされます。`;
        } else if (!user.lockedUntil) { // 初めて閾値に達した場合
          newLockedUntil = dayjs().add(INITIAL_LOCKOUT_MINUTES, 'minute').toDate();
          const remainingTime = dayjs.duration(INITIAL_LOCKOUT_MINUTES, 'minutes').format('m分');
          errorMessage = `試行回数が上限を超えました。アカウントは ${remainingTime} ロックされます。`;
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: newFailedCount,
          lockedUntil: newLockedUntil ?? user.lockedUntil,
        },
      });
      
      return NextResponse.json({ error: errorMessage }, { status: newLockedUntil ? 403 : 401 });
    }

    // --- ログイン成功時のリセット処理 ---
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    
    // ... 以降のMFA処理、トークン発行処理は変更なし ...
    if (user.mfaEnabled) {
      const mfaToken = await generateMfaToken({ sub: user.id });
      return NextResponse.json({ mfaRequired: true, mfaToken: mfaToken });
    }
    
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

