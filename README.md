# S3 → SNS → SQS → Lambda Fan-out

S3 へのファイルアップロードをトリガーに、SNS → SQS → Lambda をファンアウトさせて  
**画像のリサイズ／グレースケール** と **ぼかし／回転** を段階的に処理する CDK

- **resize 系フロー**  
  `S3 put` → `S3 Event` → `SNS` → `SQS(resize)` → `Lambda(resize)` → `SQS(grayscale)` → `Lambda(grayscale)` → `S3 put`

- **blur 系フロー**  
  `S3 put` → `S3 Event` → `SNS` → `SQS(blur)` → `Lambda(blur)` → `SQS(rotate)` → `Lambda(rotate)` → `S3 put`

---

## アーキテクチャ

flowchart LR
    %% ========= 共通 =========
    s3[S3 Bucket<br/>prefix: original/]
    sns[SNS Topic]

    %% ========= Resize → Grayscale =========
    subgraph Resize_Grayscale_Flow[Resize → Grayscale flow]
        qResize[SQS Queue<br/>resize]
        qResizeDLQ[DLQ<br/>resize]

        lResize[Lambda<br/>resize<br/>output: resize/]

        qGray[SQS Queue<br/>grayscale]
        qGrayDLQ[DLQ<br/>grayscale]

        lGray[Lambda<br/>grayscale]

        s3outGray[(S3 Bucket<br/>prefix: grayscale/)]

        sns --> qResize
        qResize --> lResize

        %% Resize Lambda → 次ステップ(SQS grayscale)
        lResize -- send message --> qGray

        qGray --> lGray
        lGray --> s3outGray

        %% DLQ
        qResize -. failed .-> qResizeDLQ
        qGray -. failed .-> qGrayDLQ
    end

    %% ========= Blur → Rotate =========
    subgraph Blur_Rotate_Flow[Blur → Rotate flow]
        qBlur[SQS Queue<br/>blur]
        qBlurDLQ[DLQ<br/>blur]

        lBlur[Lambda<br/>blur<br/>output: blur/]

        qRotate[SQS Queue<br/>rotate]
        qRotateDLQ[DLQ<br/>rotate]

        lRotate[Lambda<br/>rotate]

        s3outRotate[(S3 Bucket<br/>prefix: rotate/)]

        sns --> qBlur
        qBlur --> lBlur

        %% Blur Lambda → 次ステップ(SQS rotate)
        lBlur -- send message --> qRotate

        qRotate --> lRotate
        lRotate --> s3outRotate

        %% DLQ
        qBlur -. failed .-> qBlurDLQ
        qRotate -. failed .-> qRotateDLQ
    end

    %% ========= S3 イベント起点 =========
    s3 -- ObjectUpload --> sns
