## 認証・認可機能を持つWebアプリケーション

### 1.概要

このプロジェクトは、Next.js (App Router), Prisma, Supabase (PostgreSQL) を利用して、各種セキュリティ機能を実装したWebアプリケーションのサンプルです。トークンベース認証、多要素認証、ロールベースアクセス制御など、基本的なセキュリティ対策を実装しています。

### 2.実装された主な機能

このアプリケーションには、以下のセキュリティ機能が実装されています。

#### 2-1.認証システム

- JWTトークンベース認証:
    - 短命なアクセストークンと、HttpOnly Cookieに保存される長命なリフレッシュトークンを使用し、セッション管理を行います。
- 多要素認証(MFA/TOTP):
    - Google Authenticatorなどの認証アプリと連携し、TOTP（Time-based One-Time Password）による二要素認証を有効化できます。
- ロック機能:
    - ブルートフォース攻撃対策として、同一アカウントに対して5回以上ログインに失敗すると、アカウントが一時的にロックされます。ロック時間は攻撃が続くと段階的に延長されます。

#### 2-2.認可システム

- ロールベースアクセス制御(RBAC):

#### 2-3.技術スタック

- フレームワーク: Next.js 
- データベース: PostgreSQL
- ORM: Prisma
- 認証ライブラリ: `jose` (JWT),`otplib` (TOTP), `argon2` (パスワードハッシュ)
- UI: React, Tailwind CSS

### 3.アプリケーションの動作デモ

USERとしてログインしているとき<br>
![USERロール](/picture/test.png)

ADMINとしてログインしているとき<br>
![ADMINロール](/picture/test1.png)

パスワードを連続で間違えたとき<br>
![パスワードミス画面](/picture/test-.png)

セキュリティ設定を開いてMFA/TOTP機能有効化するためのQRコード生成画面<br>
![TOTP](/picture/test-test.png)

MFAを有効化したときのログイン動作<br>
https://youtu.be/0xiLRAZpCdw

