'use client';

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ログインに失敗しました。');
      }

      const data = await res.json();
      
      if (data.mfaRequired) {
        const token = data.mfaToken;
        console.log('Login successful, MFA required. Token received:', token);
        
        if (token) {
          // sessionStorageにトークンを保存
          sessionStorage.setItem('mfa_token', token);
          window.location.href = `/mfa/verify`;
        } else {
          setError('MFAトークンを生成できませんでした。もう一度お試しください。');
        }
        return;
      }

      console.log("ログイン成功！");
      window.location.href = '/articles';

    } catch (error : any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">ログイン</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">メールアドレス</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">パスワード</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}

