'use client';

import { useState } from 'react';

export default function MfaVerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mfaToken = sessionStorage.getItem('mfa_token');
    console.log('Attempting to verify MFA. Token from sessionStorage:', mfaToken);

    if (!mfaToken) {
      setError('セッションが見つかりません。再度ログインしてください。');
      return;
    }

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '認証に失敗しました。');
      }
      
      sessionStorage.removeItem('mfa_token');
      window.location.href = '/articles';

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">二要素認証</h2>
      <p className="text-center text-gray-600 mb-4">
        認証アプリに表示されている6桁のコードを入力してください。
      </p>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-center">確認コード</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full border rounded px-3 py-2 text-center text-2xl tracking-[.5em]"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          認証
        </button>
      </form>
    </div>
  );
}

