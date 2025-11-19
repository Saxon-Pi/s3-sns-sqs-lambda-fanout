# S3 → SNS → SQS → Lambda Fan-out

S3 へのファイルアップロードをトリガーに、SNS → SQS → Lambda をファンアウトさせて  
**画像のリサイズ／グレースケール** と **ぼかし／回転** を段階的に処理する CDK

- **resize 系フロー**  
  `S3 put` → `S3 Event` → `SNS` → `SQS(resize)` → `Lambda(resize)` → `SQS(grayscale)` → `Lambda(grayscale)` → `S3 put`

- **blur 系フロー**  
  `S3 put` → `S3 Event` → `SNS` → `SQS(blur)` → `Lambda(blur)` → `SQS(rotate)` → `Lambda(rotate)` → `S3 put`

---

## アーキテクチャ

### Resize / Grayscale パイプライン

```mermaid
flowchart LR
    s3[S3 Bucket<br/>prefix: original/]
    sns[SNS Topic]
    qResize[SQS Queue<br/>resize]
    qResizeDLQ[DLQ<br/>resize]
    lResize[Lambda<br/>resize]
    qGray[SQS Queue<br/>grayscale]
    qGrayDLQ[DLQ<br/>grayscale]
    lGray[Lambda<br/>grayscale]
    s3out[(S3 Bucket<br/>processed images)]

    s3 -- ObjectCreated --> sns
    sns --> qResize
    qResize --> lResize
    lResize --> qGray
    qGray --> lGray
    lGray --> s3out

    qResize -. failed .-> qResizeDLQ
    qGray -. failed .-> qGrayDLQ
```

### Blur / Rotate パイプライン

```mermaid
flowchart LR
    s3b[S3 Bucket<br/>prefix: original/]
    snsB[SNS Topic]
    qBlur[SQS Queue<br/>blur]
    qBlurDLQ[DLQ<br/>blur]
    lBlur[Lambda<br/>blur]
    qRotate[SQS Queue<br/>rotate]
    qRotateDLQ[DLQ<br/>rotate]
    lRotate[Lambda<br/>rotate]
    s3outB[(S3 Bucket<br/>processed images)]

    s3b -- ObjectCreated --> snsB
    snsB --> qBlur
    qBlur --> lBlur
    lBlur --> qRotate
    qRotate --> lRotate
    lRotate --> s3outB

    qBlur -. failed .-> qBlurDLQ
    qRotate -. failed .-> qRotateDLQ
```
