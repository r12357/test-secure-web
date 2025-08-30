import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// 環境変数から秘密鍵を取得
// process.env.JWT_ACCESS_SECRET と process.env.JWT_REFRESH_SECRET を設定してください。
// これらの秘密鍵は強力なランダムな文字列（例: openssl rand -base64 32）を使用し、安全に管理してください。
const JWT_ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
const JWT_MFA_SECRET = new TextEncoder().encode(process.env.JWT_MFA_SECRET);



// JWTの有効期限
export const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 例: 15分
export const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 例: 7日
export const MFA_TOKEN_EXPIRES_IN = '3m'; // 例: 3分

/**
 * アクセストークンを生成する
 * @param payload JWTペイロード
 * @returns 署名されたJWT
 */
export async function generateAccessToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(JWT_ACCESS_SECRET);
}

/**
 * リフレッシュトークンを生成する
 * @param payload JWTペイロード
 * @returns 署名されたJWT
 */
export async function generateRefreshToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(JWT_REFRESH_SECRET);
}

/**
 * アクセストークンを検証する
 * @param token 検証するJWT
 * @returns 検証されたJWTペイロード
 */
export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_ACCESS_SECRET);
    return payload;
  } catch (error) {
    console.error('Access Token verification failed:', error);
    return null;
  }
}

/**
 * リフレッシュトークンを検証する
 * @param token 検証するJWT
 * @returns 検証されたJWTペイロード
 */
export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload;
  } catch (error) {
    console.error('Refresh Token verification failed:', error);
    return null;
  }
}

/**
 * JWTをデコードする（署名検証なし）
 * 主にクライアント側での表示や、検証前の情報参照用に使用。
 * セキュリティ上の理由から、認証や認可には使用しないでください。
 * @param token デコードするJWT
 * @returns JWTペイロード
 */
export function decodeJwt(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}




/**
 * MFA検証用の一時トークンを生成する
 * @param payload JWTペイロード (userIdなど)
 */
export async function generateMfaToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(MFA_TOKEN_EXPIRES_IN)
    .sign(JWT_MFA_SECRET);
}

/**
 * MFA検証用の一時トークンを検証する
 * @param token 検証するJWT
 */
export async function verifyMfaToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_MFA_SECRET);
    return payload;
  } catch (error) {
    console.error('MFA Token verification failed:', error);
    return null;
  }
}
// --- ここまで ---
