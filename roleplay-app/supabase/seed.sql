-- Sample data for testing

-- Insert sample manuals
INSERT INTO manuals (title, category, content) VALUES
('初回接客マニュアル', '初回対応', '初めてご来店されたお客様への接客方法について説明します。

1. 笑顔でお出迎え
- お客様が入店されたら、すぐに気づいて笑顔でお迎えしましょう
- 「いらっしゃいませ」と明るく元気な声で挨拶します

2. ニーズの確認
- 「本日はどのようなものをお探しですか？」と優しく尋ねます
- お客様の話をしっかりと聞き、ニーズを理解します

3. 商品の提案
- お客様のニーズに合った商品を2-3点提案します
- 商品の特徴やメリットを分かりやすく説明します'),

('クレーム対応マニュアル', 'クレーム対応', 'お客様からのクレームに適切に対応するための手順です。

1. まずは謝罪
- お客様の気持ちに寄り添い、不快な思いをさせたことを謝罪します
- 「ご不便をおかけして申し訳ございません」

2. 傾聴する
- お客様の話を最後まで聞きます
- 途中で遮らず、相槌を打ちながら聞きます

3. 事実確認
- 何が起きたのか、具体的に確認します
- 必要に応じて関係者に確認を取ります

4. 解決策の提示
- できる限りの解決策を提案します
- お客様に選択肢を提供し、納得いただける方法を探ります'),

('電話対応マニュアル', '電話対応', '電話でのお問い合わせに対する基本的な対応方法です。

1. 3コール以内に出る
- 電話が鳴ったら、できるだけ3コール以内に出ましょう

2. 明るい声で応対
- 「お電話ありがとうございます。〇〇店の△△です」
- 相手の顔が見えなくても、笑顔で話すと声が明るくなります

3. 用件を確認
- 「どのようなご用件でしょうか？」と丁寧に尋ねます
- メモを取りながら、重要な情報を記録します

4. 復唱確認
- お客様のおっしゃった内容を復唱して確認します
- 間違いがないか、お客様に確認していただきます');

-- Insert sample scenarios
INSERT INTO scenarios (title, description, related_manual_id) VALUES
('初めてのお客様への商品説明', 'あなたは家電量販店の店員です。初めて来店されたお客様が、新しいノートパソコンを探しています。お客様は「在宅ワーク用のパソコンが欲しい」とおっしゃっています。適切に接客してください。', 
(SELECT id FROM manuals WHERE title = '初回接客マニュアル' LIMIT 1)),

('商品の不具合に関するクレーム', 'あなたはスマートフォンショップの店員です。お客様が「昨日買ったスマートフォンの画面が急につかなくなった」と怒っています。適切にクレーム対応をしてください。',
(SELECT id FROM manuals WHERE title = 'クレーム対応マニュアル' LIMIT 1)),

('電話での在庫確認', 'あなたは書店の店員です。お客様から電話で「〇〇という本の在庫はありますか？」という問い合わせがありました。適切に電話対応をしてください。',
(SELECT id FROM manuals WHERE title = '電話対応マニュアル' LIMIT 1)),

('価格交渉への対応', 'あなたは家具店の店員です。お客様が気に入ったソファーについて「もう少し安くならないか」と価格交渉をしてきました。丁寧に対応してください。', NULL),

('商品の使い方説明', 'あなたは化粧品店の店員です。お客様が新しいスキンケア商品について「使い方がよく分からない」とおっしゃっています。分かりやすく説明してください。', NULL);

-- Insert sample recordings
INSERT INTO recordings (scenario_id, audio_url, transcript) VALUES
((SELECT id FROM scenarios WHERE title = '初めてのお客様への商品説明' LIMIT 1), 
 'https://example.com/audio1.mp3', 
 'いらっしゃいませ。本日はどのようなものをお探しでしょうか？在宅ワーク用のパソコンですね。お客様の用途に合わせて、いくつかおすすめの商品をご紹介させていただきます。'),

((SELECT id FROM scenarios WHERE title = '商品の不具合に関するクレーム' LIMIT 1), 
 'https://example.com/audio2.mp3', 
 'ご不便をおかけして申し訳ございません。昨日ご購入いただいたスマートフォンの画面が急につかなくなったとのことですね。まずは詳しい状況をお聞かせください。'),

((SELECT id FROM scenarios WHERE title = '電話での在庫確認' LIMIT 1), 
 'https://example.com/audio3.mp3', 
 'お電話ありがとうございます。〇〇書店の田中でございます。〇〇という本の在庫確認ですね。少々お待ちください。'),

((SELECT id FROM scenarios WHERE title = '価格交渉への対応' LIMIT 1), 
 'https://example.com/audio4.mp3', 
 'このソファーについて価格のご相談ですね。お客様にご満足いただけるよう、できる限りの対応をさせていただきます。'),

((SELECT id FROM scenarios WHERE title = '商品の使い方説明' LIMIT 1), 
 'https://example.com/audio5.mp3', 
 'このスキンケア商品の使い方についてご説明いたします。まずはクレンジングから始めて、その後化粧水、美容液の順番でお使いください。');

-- Insert sample evaluations
INSERT INTO evaluations (recording_id, total_score, summary_comment) VALUES
((SELECT id FROM recordings LIMIT 1 OFFSET 0), 4, '全体的に良い接客でしたが、もう少し具体的な商品の特徴を説明するとより良くなります。'),
((SELECT id FROM recordings LIMIT 1 OFFSET 1), 5, 'クレーム対応が非常に適切でした。お客様の気持ちに寄り添った対応ができています。'),
((SELECT id FROM recordings LIMIT 1 OFFSET 2), 3, '基本的な電話対応はできていますが、もう少し丁寧な言葉遣いを心がけましょう。'),
((SELECT id FROM recordings LIMIT 1 OFFSET 3), 4, '価格交渉への対応が適切でした。お客様の要望を理解し、柔軟な対応ができています。'),
((SELECT id FROM recordings LIMIT 1 OFFSET 4), 5, '商品の使い方説明が非常に分かりやすく、お客様のニーズに合った説明ができています。');