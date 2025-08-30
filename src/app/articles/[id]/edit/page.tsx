import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ArticleForm from '@/app/_components/ArticleForm';
import { createOrUpdateArticle } from '@/lib/actions';

// ページのプロパティ（props）の型を明示的に定義します
type EditArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

// コンポーネントの引数で、上で定義した型を使用します
export default async function EditArticlePage({ params }: EditArticlePageProps) {
  // paramsを非同期で解決します
  const { id } = await params;
  
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  // 更新アクションに記事IDを束縛(bind)します
  const updateAction = createOrUpdateArticle.bind(null, article.id);

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4">記事を編集</h2>
      <ArticleForm
        action={updateAction}
        initialData={{ title: article.title, content: article.content }}
        buttonText="更新"
      />
    </div>
  );
}