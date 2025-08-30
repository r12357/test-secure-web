'use server';

import { z } from 'zod';
import { getSession } from './auth';
import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';


const ArticleSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です。').max(100, 'タイトルは100文字以内で入力してください。'),
  content: z.string().min(1, '本文は必須です。'),
});

export async function createOrUpdateArticle(
  articleId: string | null,
  _prevState: any,
  formData: FormData
) {
  const session = await getSession();
  if (!session) {
    return { error: '認証が必要です。' };
  }

  const validatedFields = ArticleSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    return {
      error: '入力内容に誤りがあります。',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, content } = validatedFields.data;

  try {
    if (articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      if (!article) {
        return { error: '記事が見つかりません。' };
      }

      const isAdmin = session.roles.includes('ADMIN');
      if (!isAdmin && article.authorId !== session.id) {
        return { error: 'この記事を編集する権限がありません。' };
      }

      await prisma.article.update({
        where: { id: articleId },
        data: { title, content },
      });
    } else {
      await prisma.article.create({
        data: {
          title,
          content,
          authorId: session.id,
        },
      });
    }
  } catch (error) {
    console.error('データベース操作に失敗しました:', error);
    return { error: 'サーバーエラーが発生しました。' };
  }

  revalidatePath('/articles');
  redirect('/articles');
}

export async function deleteArticle(articleId: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('認証が必要です。');
  }

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error('記事が見つかりません。');
    }

    const isAdmin = session.roles.includes('ADMIN');
    if (!isAdmin && article.authorId !== session.id) {
      throw new Error('この記事を削除する権限がありません。');
    }

    await prisma.article.delete({
      where: { id: articleId },
    });

    revalidatePath('/articles');
    return { success: true };

  } catch (error: Error | any) {
    console.error('削除に失敗しました:', error);
    return { error: error.message || 'サーバーエラーが発生しました。' };
  }
}

/**
 * ログアウト処理を行うServer Action
 */
export async function logout() {
  // 1. セッション情報を取得して、トークンID(jti)を特定
  const session = await getSession();
  if (session?.jti) {
    try {
      // 2. DBのリフレッシュトークンを無効化(revoked: true)
      await prisma.refreshToken.update({
        where: { jti: session.jti },
        data: { revoked: true },
      });
    } catch (error) {
      // トークンが見つからない等のエラーは無視して処理を続行
      console.error("Failed to revoke refresh token:", error);
    }
  }

  // 3. Cookieを削除
  (await cookies()).delete('refreshToken');

  // 4. ホームページにリダイレクト
  redirect('/');
}


// --- MFA有効化のためのActionを修正 ---

/**
 * MFAの秘密鍵を生成し、QRコードを返す
 * useActionStateで使われるため、prevStateとformDataを受け取る
 */
export async function generateMfaSecret(
  // 戻り値の型と合わせるため、プロパティをオプショナルにする
  _prevState: { error?: string; qrCodeUrl?: string },
  _formData: FormData // formDataは使いませんが、型を合わせるために必要
): Promise<{ error?: string; qrCodeUrl?: string }> { // 戻り値の型も修正
  const session = await getSession();
  if (!session) {
    return { error: '認証が必要です。' };
  }

  // 既存の有効なシークレットがあれば再利用、なければ新規作成
  let secret = await prisma.tOTPSecret.findFirst({
    where: { userId: session.id, revokedAt: null },
  });

  if (!secret) {
    const newSecret = authenticator.generateSecret();
    secret = await prisma.tOTPSecret.create({
      data: {
        userId: session.id,
        secret: newSecret,
      },
    });
  }
  
  const otpauth = authenticator.keyuri(session.email, 'Secure Web App', secret.secret);

  try {
    const qrCodeUrl = await qrcode.toDataURL(otpauth);
    return { qrCodeUrl };
  } catch (error) {
    console.error('QRコードの生成に失敗しました:', error);
    return { error: 'QRコードの生成に失敗しました。' };
  }
}

/**
 * ユーザーが入力したMFAトークンを検証し、MFAを有効化する
 */
export async function verifyMfaToken(
  prevState: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: '認証が必要です。' };
  }

  const token = formData.get('mfaToken') as string;
  if (!token || !/^\d{6}$/.test(token)) {
    return { error: '6桁のコードを入力してください。' };
  }

  const secretRecord = await prisma.tOTPSecret.findFirst({
    where: { userId: session.id, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!secretRecord) {
    return { error: 'MFAシークレットが見つかりません。再度QRコードを生成してください。' };
  }

  const isValid = authenticator.verify({
    token,
    secret: secretRecord.secret,
  });

  if (!isValid) {
    return { error: 'コードが正しくありません。' };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { mfaEnabled: true },
  });

  revalidatePath('/settings/security');
  return { success: 'MFAが正常に有効化されました。' };
}

