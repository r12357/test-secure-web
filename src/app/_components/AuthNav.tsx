import Link from 'next/link';
// エイリアスパス '@/lib/...' を相対パスに修正
import { getSession } from '@/lib/auth';
import { logout } from '@/lib/actions';

export default async function AuthNav() {
  const session = await getSession();

  return (
    <div className="space-x-4 flex items-center">
      <Link href="/" className="text-blue-500 hover:underline">
        ホーム
      </Link>
      <Link href="/articles" className="text-blue-500 hover:underline">
        記事一覧
      </Link>
      {session ? (
        <>
          <span className="text-sm text-gray-600">{session.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-blue-500 hover:underline"
            >
              ログアウト
            </button>
          </form>
          <Link href="/settings/security" className="text-blue-500 hover:underline">
            セキュリティ設定
          </Link>
        </>
      ) : (
        <Link href="/login" className="text-blue-500 hover:underline">
          ログイン
        </Link>
      )}
    </div>
  );
}

