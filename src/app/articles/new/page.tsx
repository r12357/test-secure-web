import ArticleForm from '@/app/_components/ArticleForm'; // ディレクトリ名に合わせてパスを修正
import { createOrUpdateArticle } from '@/lib/actions';

export default function NewArticlePage() {
  // Server Action `createOrUpdateArticle` の第一引数(articleId)に null を束縛して、
  // 新規作成用のアクションとして ArticleForm に渡す
  const createAction = createOrUpdateArticle.bind(null, null);

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4">新しい記事を作成</h2>
      <ArticleForm action={createAction} buttonText="作成する" />
    </div>
  );
}

