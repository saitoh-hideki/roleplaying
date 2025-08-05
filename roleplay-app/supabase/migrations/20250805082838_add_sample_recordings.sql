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
