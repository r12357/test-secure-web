'use client';

import { useActionState } from 'react';
import { generateMfaSecret, verifyMfaToken } from '@/lib/actions';

type SecurityPageClientProps = {
  isMfaEnabled: boolean;
};

export default function SecurityPageClient({ isMfaEnabled }: SecurityPageClientProps) {
  // useActionStateの初期値のプロパティをnullからundefinedに変更します
  const [generateState, generateAction] = useActionState(generateMfaSecret, { error: undefined, qrCodeUrl: undefined });
  const [verifyState, verifyAction] = useActionState(verifyMfaToken, { error: undefined, success: undefined });

  if (isMfaEnabled || verifyState.success) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">多要素認証 (MFA)</h2>
        <p className="text-green-600">現在、多要素認証は有効です。</p>
        {/* TODO: MFA無効化機能はここに追加 */}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">多要素認証 (MFA) の設定</h2>
        <p className="text-gray-600 mb-4">
          セキュリティを強化するため、Google Authenticatorなどの認証アプリでMFAを設定します。
        </p>
        <form action={generateAction}>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!!generateState.qrCodeUrl}
          >
            QRコードを生成
          </button>
        </form>
        {generateState.error && <p className="text-red-500 mt-2">{generateState.error}</p>}
      </div>

      {generateState.qrCodeUrl && (
        <div>
          <h3 className="font-semibold">ステップ2: QRコードをスキャン</h3>
          <p className="text-gray-600 mb-2">認証アプリで以下のQRコードをスキャンしてください。</p>
          <img src={generateState.qrCodeUrl} alt="MFA QR Code" className="border rounded" />

          <h3 className="font-semibold mt-6">ステップ3: 確認コードを入力</h3>
          <p className="text-gray-600 mb-2">アプリに表示された6桁のコードを入力して設定を完了します。</p>
          <form action={verifyAction} className="flex items-center space-x-2">
            <input
              type="text"
              name="mfaToken"
              maxLength={6}
              className="w-32 border rounded px-3 py-2 text-center tracking-widest"
              placeholder="123456"
              required
            />
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              有効化して完了
            </button>
          </form>
          {verifyState.error && <p className="text-red-500 mt-2">{verifyState.error}</p>}
        </div>
      )}
    </div>
  );
}

