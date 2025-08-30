import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">ホーム</h2>
      <p className="mb-6">このサイトは認証・認可のデモ用です。</p>
      <div className="space-x-4">
        <Link
          href="/articles"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          記事一覧へ
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          ログイン
        </Link>
      </div>
    </div>
  );
}
