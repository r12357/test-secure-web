// 既存の型定義 ...
export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type UserRole = {
  userId: string;
  roleId: string;
  role: Role;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  jti?: string;
};

// --- ここから追加 ---

// Articleモデルの基本的な型
export type Article = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

// 記事一覧ページで使う、著者情報（email）を含む記事の型
export type ArticleWithAuthor = Article & {
  author: {
    email: string;
  };
};

