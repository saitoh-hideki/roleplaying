-- Update philosophy statements to organization-specific content
UPDATE philosophy_evaluation_criteria
SET description = 'デジタル化する社会における格差を解消する'
WHERE code = 'vision';

UPDATE philosophy_evaluation_criteria
SET description = '全てのお宅にデジタル担当を'
WHERE code = 'mission';

UPDATE philosophy_evaluation_criteria
SET description = '当クラブの普及継続で社会に貢献する'
WHERE code = 'purpose';


