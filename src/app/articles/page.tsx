import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ArticleWithAuthor } from '@/types';
import DeleteButton from '@/app/_components/DeleteButton';


export default async function ArticlesPage() {
  // ログインセッションと記事一覧を並行して取得
  const [session, articles] = await Promise.all([
    getSession(),
    prisma.article.findMany({
      include: {
        author: {
          select: { email: true }, // 著者のメールアドレスも取得
        },
      },
      orderBy: {
        createdAt: 'desc', // 新しい順に並べる
      },
    }),
  ]);

  const isAdmin = session?.roles.includes('ADMIN') ?? false;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">記事一覧</h2>
        {/* ログインしているユーザーのみ作成ボタンを表示 */}
        {session && (
          <Link
            href="/articles/new"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            新規作成
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {articles.map((article:ArticleWithAuthor) => {
          // 編集・削除ボタンを表示する権限があるかどうかのフラグ
          const canEdit = session && (isAdmin || article.authorId === session.id);

          return (
            <div
              key={article.id}
              className="bg-white shadow rounded p-4"
            >
              <h3 className="text-xl font-semibold">{article.title}</h3>
              <p className="text-sm text-gray-500 mb-2">
                投稿者: {article.author.email}
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">{article.content}</p>
              
              {/* 権限がある場合のみ編集・削除ボタンを表示 */}
              {canEdit && (
                <div className="flex items-center space-x-4 mt-4">
                  <Link
                    href={`/articles/${article.id}/edit`}
                    className="text-sm text-green-500 hover:underline"
                  >
                    編集
                  </Link>
                  <DeleteButton articleId={article.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

