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

`process`の型定義が見つからないというエラーになる。これは`dotenv`をインストールしていないのが原因だった。使わないけどとりあえずインストールしておく。`dotenv`をインポートしたら、そのファイルで`process`が使えるようになるみたいだった。どういう型定義を書いているのか後で見てみる。

Workersから環境変数`DATABASE_URL`を読み取れなくて、`undefined`になっていた。プロセスに設定した環境変数が読み込まれるわけではないようだ。

wranglerでは、シークレットは`dev.vars`に設定する必要がある。設定してから再起動すると、読み込まれているというメッセージがターミナルに表示された。

`wrangler`でデプロイする。直後にアクセスするとのようなエラーになったが、時間が経過すると直った。

![](https://i.gyazo.com/b8d6083682849cdfc0aa4e8a657e0263.png)

最後に`DATABASE_URL`環境変数を設定する。Neonのインテグレーションが用意されているので、設定からポチポチすると接続できるようになった。

## 気になったこと・まとめ

wranglerは、ローカルでの開発からデプロイまでをサポートしてくれるツールだった。TypeScriptのビルドを明示的にやっていないので、WorkersではESMとCJSのどちらのJSが動いているのかが気になった。"module": "es2022"なのでESM？

wranglerで環境変数を設定する場合は、`wrangler.toml`に書くか、セキュアなものは`.dev.vars`に書く必要がある。プロセスに設定した環境変数は読み込まれないので、注意が必要。

Drizzleのマイグレーションについて。`CREATE TABLE IF NOT EXISTS`になっているが、毎回全てのマイグレーションが実行される訳ではなさそうだ。`CREATE TABLE`に変更してもエラーは出ないし、`_drizzle_migrations`テーブルにマイグレーションの履歴もある。確かに、毎回全部実行するとカラムのRENAMEの2回目はエラーになるので、それはできないなと気づいた。

Drizzleについて。カラムの名前とTypeScriptの型を分けられるのはいいところかなと思った。DBはスネークケース、TypeScriptはキャメルケースみたいなのができる。

```ts
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull(),
});
```

クエリビルダは、`select`を先に書くことや、その中身が独特だと感じた。型のエイリアスを設定できるのは便利かもしれないが、実行時エラーを防ぎにくくなっているのではないかと思う。

```ts
import { products } from './db/schema';
const result = await db
	.select({
		id: products.id,
		price: products.price,
	})
	.from(products);
```

例えば、FROM句で選択していないテーブルをselectで選択することをコンパイル時に防げない。`select({ userId: users.id })`みたいに書くと実行時エラーになる。FROMを最初に書くのがベターだと思うので、個人的には合わなさそうだなと感じた。

CloudflareもNeonもダッシュボードが綺麗でいいなと思った。

Neonのリージョンは一番近いSingaporeに作っても、レイテンシが300~400msくらいありそうだった。まだちょっと使うのはしんどいかもしれない。
