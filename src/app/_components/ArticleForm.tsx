'use client';

// useFormStateを削除し、reactからuseActionStateをインポート
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

type FormState = {
  error: string | null;
  fieldErrors?: {
    title?: string[];
    content?: string[];
  } | null;
};

type ArticleFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  initialData?: { title: string; content: string };
  buttonText?: string;
};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
    >
      {pending ? '処理中...' : text}
    </button>
  );
}

export default function ArticleForm({
  action,
  initialData = { title: '', content: '' },
  buttonText = '送信',
}: ArticleFormProps) {
  // useFormState を useActionState に変更
  const [state, formAction] = useActionState<FormState, FormData>(action, { error: null, fieldErrors: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <div>
        <label htmlFor="title" className="block mb-1 font-medium">タイトル</label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialData.title}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-red-500 text-sm mt-1">{state.fieldErrors.title[0]}</p>
        )}
      </div>
      <div>
        <label htmlFor="content" className="block mb-1 font-medium">本文</label>
        <textarea
          id="content"
          name="content"
          defaultValue={initialData.content}
          className="w-full border rounded px-3 py-2 h-40 focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
        {state.fieldErrors?.content && (
          <p className="text-red-500 text-sm mt-1">{state.fieldErrors.content[0]}</p>
        )}
      </div>
      <SubmitButton text={buttonText} />
    </form>
  );
}
