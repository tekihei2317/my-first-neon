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

バインディングとは、Workersに紐づけられたサービスなどのこと。バインディングには、KV、Queue、D1、環境変数などがある。

Neonのプロジェクトを作ってみると、Pooled connectionとDirect connectionの2つが確認できる。とりあえずDirect connectionを使ってみることにした。

drizzleのスキーマ定義、TypeScriptのフィールド名と、データベースのカラム名をマッピングできるのがいいなと思った。

生成されたマイグレーションファイルは次のとおり。`CREATE TABLE IF NOT EXISTS`になっているのが気になる。毎回全てのマイグレーションを実行するのだろうか。

```sql
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"price" double precision
);
```

`process`の型定義が見つからないというエラーになる。@types/nodeをインストールする必要があるのかなと思ったけれど、完成版のリポジトリには追加されていない。

`dotenv`をインストールしていないのが原因だった。使わないけどとりあえずインストールしておく。`dotenv`をインポートしたら、そのファイルで`process`が使えるようになるみたいだった。どういう型定義を書いているのか後で見てみる。

Workersから環境変数`DATABASE_URL`を読み取れなくて、`undefined`になっています。プロセスに設定しているのですが、ダメそうでした。どこに設定すればいいのでしょうか。

wranglerでは、シークレットは`dev.vars`に設定するようでした。設定してから再起動すると、読み込まれているというメッセージがターミナルに表示されました。

デプロイは成功したものの、ページにアクセスすると次のようなエラーになりました。

![](https://i.gyazo.com/b8d6083682849cdfc0aa4e8a657e0263.png)

これは時間が経過すると直りました。
