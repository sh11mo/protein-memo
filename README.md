# protein-memo

LINE Bot でプロテイン摂取量を記録・管理するアプリ。

**インフラ:** Google Cloud Run + Cloud SQL (MySQL) + Terraform

---

## ローカル開発

```bash
# MySQL 起動
docker compose up -d

# 依存インストール
npm install

# DBマイグレーション
npm run db:migrate

# 開発サーバー起動
npm run dev
```

`.env` に以下を設定する：

```
LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...
MYSQL_USER=protein
MYSQL_PASSWORD=protein_pass
MYSQL_DATABASE=protein_memo
MYSQL_HOST=127.0.0.1
```

---

## リリース手順

### 1. Docker イメージをビルド & プッシュ

```bash
IMAGE=asia-northeast1-docker.pkg.dev/orange-prod01/apps/protein-memo:latest

docker build --platform linux/amd64 -t $IMAGE .
docker push $IMAGE
```

> Apple Silicon (M1/M2/M3) Mac でビルドする場合、`--platform linux/amd64` が必須。指定しないと Cloud Run で `exec format error` になる。
>
> 初回は `gcloud auth configure-docker asia-northeast1-docker.pkg.dev` が必要。

### 2. Terraform で Cloud Run をデプロイ

```bash
cd terraform
terraform apply -var-file=terraform.tfvars
```

`protein_memo_image` は `terraform.tfvars` で固定されているため、イメージを差し替えた場合は `terraform.tfvars` を更新するか、コマンドラインで上書きする：

```bash
terraform apply -var="protein_memo_image=asia-northeast1-docker.pkg.dev/orange-prod01/apps/protein-memo:<tag>"
```

### 3. 動作確認

Cloud Run の URL を LINE Developers の Webhook URL に設定し、Bot にメッセージを送って動作を確認する。

---

## 使い方

| メッセージ            | 動作                  |
| --------------------- | --------------------- |
| `25` / `25g` / `+25g` | プロテインを記録      |
| `-10g`                | 記録を取り消し        |
| `今日は？`            | 今日の合計を表示      |
| `昨日は？`            | 昨日の合計を表示      |
| `今週` / `一週間`     | 過去7日間の一覧を表示 |
| `目標 100g`           | 1日の目標を設定       |
