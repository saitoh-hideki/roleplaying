-- Insert sample recordings using scenes table
INSERT INTO recordings (scenario_id, audio_url, transcript) VALUES
('scene_001', 
 'https://example.com/audio1.mp3', 
 'いらっしゃいませ。パソコンの調子が悪いとのことですね。お困りの状況を詳しくお聞かせください。どのような症状が出ていますか？'),

('scene_003', 
 'https://example.com/audio2.mp3', 
 '田中様、お久しぶりです。お元気でしたか？今日はどのようなご用件でしょうか？'),

('scene_006', 
 'https://example.com/audio3.mp3', 
 'お電話ありがとうございます。先日お送りしたDMについて、ご質問やご相談がございましたらお聞かせください。'),

('scene_007', 
 'https://example.com/audio4.mp3', 
 '会員を辞めたいとのことですね。まずはどのようなお考えでいらっしゃるか、お聞かせいただけますでしょうか？'),

('scene_009', 
 'https://example.com/audio5.mp3', 
 '山田様からご紹介いただいたとのことですね。ありがとうございます。どのようなサービスにご興味がございますか？');

-- Insert sample evaluations
INSERT INTO evaluations (recording_id, total_score, summary_comment) VALUES
((SELECT id FROM recordings WHERE scenario_id = 'scene_001' LIMIT 1), 4, '初回接客として適切な対応でした。お客様の困りごとを丁寧に聞き取ることができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_003' LIMIT 1), 5, '久しぶりの会員様への対応が非常に自然で、関係性を活かした接客ができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_006' LIMIT 1), 3, '電話対応の基本はできていますが、もう少し丁寧な言葉遣いを心がけましょう。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_007' LIMIT 1), 4, 'ネガティブな状況でも冷静に対応できています。お客様の気持ちに寄り添った対応ができています。'),
((SELECT id FROM recordings WHERE scenario_id = 'scene_009' LIMIT 1), 5, '紹介客への対応が非常に適切でした。期待値の高いお客様への接客ができています。');
