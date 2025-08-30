'use client';

import { deleteArticle } from '@/lib/actions';

export default function DeleteButton({ articleId }: { articleId: string }) {

  // Server Actionを呼び出すためのラッパー関数です。
  // この関数の戻り値はvoid型となり、TypeScriptのエラーを解消します。
  const formAction = async () => {
    const result = await deleteArticle(articleId);
    if (result?.error) {
      // サーバーからエラーが返された場合にアラートを表示
      alert(`削除に失敗しました: ${result.error}`);
    }
  };

  return (
    <form action={formAction}>
      <button
        type="submit"
        className="text-sm text-red-500 hover:underline"
        onClick={(e) => {
          // ユーザーがキャンセルした場合、フォームの送信を中止します
          if (!confirm('本当に削除しますか？')) {
            e.preventDefault();
          }
        }}
      >
        削除
      </button>
    </form>
  );
}

