-- Add fifth evaluation criteria to all scenes to standardize to 5 items per scene
-- This migration adds the missing 5th evaluation criterion to scenes 002-009

INSERT INTO scene_evaluation_criteria (scene_id, criterion_name, criterion_description, max_score, sort_order) VALUES
    -- Scene 002: お約束をしていた会員様が来店 (予約確認済み会員への対応)
    ('scene_002', 'お客様満足度', '予約していただいた会員様に満足いただける対応ができているか', 5, 5),
    
    -- Scene 003: 久しぶりに来店された会員様 (継続関係の維持)
    ('scene_003', 'フォローアップ', '今後の継続的な関係維持のためのフォローアップができているか', 5, 5),
    
    -- Scene 004: パソコンが調子悪くて初めてお客様が来店 (初回訪問対応)
    ('scene_004', 'アフターサポート', '解決後のアフターサポートや継続的な関係構築ができているか', 5, 5),
    
    -- Scene 005: 会員の方同士のペースで接客練習 (イベント対応)
    ('scene_005', 'コミュニティ形成', '会員同士のコミュニティ形成を促進する対応ができているか', 5, 5),
    
    -- Scene 006: 街で見かけて声をかけた非会員への接客 (アウトリーチ)
    ('scene_006', 'フォローアップ', '今後の関係継続のための適切なフォローアップができているか', 5, 5),
    
    -- Scene 007: 辞めたいと言ってきた会員様 (退会抑制)
    ('scene_007', '継続意欲の向上', '会員として継続したいという意欲を高められているか', 5, 5),
    
    -- Scene 008: SmartLife AO校に興味を示す会員様 (サービス紹介)
    ('scene_008', '成約への導線', 'SmartLife AO校への具体的な申し込みに導けているか', 5, 5),
    
    -- Scene 009: 紹介で来店したお客様 (紹介顧客対応)
    ('scene_009', '継続関係の構築', '今後も継続的な関係を築ける基盤作りができているか', 5, 5);