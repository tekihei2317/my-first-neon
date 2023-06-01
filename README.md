# my-first-neon

[Build a serverless API using Cloudflare Workers, Drizzle ORM, and Neon - Neon](https://neon.tech/blog/api-cf-drizzle-neon)をやります。

## 目的

- drizzle-orm、Cloudflare Workers、Neonのどれも使ったことがないので、使ってみること

## 知っていること

drizzle-ormは、マイグレーション機能をそなえたクエリビルダ。TypeScriptでテーブル定義を書き、そこからマイグレーションとDBクライアントを作成する感じだったと思う。

Cloudflare Workersは、エッジ関数の一種。ユーザーに近いところで処理を実行できることや、ランタイムやインフラの管理をしなくていいことにメリットがある。コールドスタートを発生させないために関数のサイズに厳しい制限があり、無料プランでは1MB以内に抑える必要がある。

Cloudflare Workersをローカルで動かすために、wranglerというツールがある。

NeonはサーバーレスのPostgreSQLで、Vercel PostgresはNeonの上に構築されている。サーバーレス関数からデータベースにアクセスする場合は、コネクションプールが使えないのが問題になる（コネクションプールはサーバー内で行われる認識）。

Prismaではこれを防ぐためのData Proxyというサービスがあるが、あまり使い勝手が良くない（日本からだと遅い）。Neonだと、接続URLを変えるだけでPgBouncerを経由していい感じにやってくれるようだ。

## やってみる

![](https://i.gyazo.com/654207d3fe2fa2804da9db42c9c15465.png)
