-- Add description column to topics and seed detailed subject/topic data with examples

ALTER TABLE "topics"
  ADD COLUMN IF NOT EXISTS "description" text;

-- Ensure required subjects exist
WITH subject_names(name) AS (
  VALUES
    ('数学'),
    ('物理'),
    ('化学'),
    ('英語')
)
INSERT INTO "subjects" (id, name)
SELECT gen_random_uuid(), subject_names.name
FROM subject_names
ON CONFLICT (name) DO NOTHING;

-- Insert or update topic details with question examples
WITH topic_data(subject_name, topic_name, topic_description) AS (
  VALUES
    ('数学', '指数・対数', '質問例: 「log2(8x)=5 なので 8x=5 だと思いました。なぜ違いますか。」'),
    ('数学', '微分（積の法則）', '質問例: 「d/dx(x^2 sin x)=2x sin x で良いと思いました。なぜ違いますか。」'),
    ('数学', '三角関数（加法定理）', '質問例: 「cos(α+β)=cosα+cosβ ですよね？ なぜ違いますか。」'),
    ('数学', '数列（等比）', '質問例: 「1,2,4,8,… の一般項は 2^n-1 だと思いました。なぜ違いますか。」'),
    ('数学', 'ベクトル', '質問例: 「a・b=0 は平行を意味すると覚えました。なぜ違いますか。」'),
    ('数学', '確率', '質問例: 「サイコロ2回で『少なくとも1回1が出る』の確率は 1/6 と同じだと思いました。なぜ違いますか。」'),
    ('数学', '複素数', '質問例: 「(1+i)(1-i) は i と -i が打ち消し合うので 0 になると思いました。なぜ違いますか。」'),
    ('数学', '解析幾何（円）', '質問例: 「x^2+y^2+4x-6y+9=0 は中心が原点の円だと思いました。なぜ違いますか。」'),
    ('物理', '等加速度直線運動', '質問例: 「等加速度でも x=vt で計算できると思い、a=2 m/s^2, t=5 s なら 50 m と出ました。なぜ違いますか。」'),
    ('物理', '斜面上の力', '質問例: 「斜面上では重力 mg がそのまま斜面方向に働くので分解は不要だと思いました。なぜ違いますか。」'),
    ('物理', '力のつり合い', '質問例: 「机の上で静止している物体には力がかかっていないと思いました。なぜ違いますか。」'),
    ('物理', '衝突', '質問例: 「どんな衝突でも運動エネルギーは保存するはずだと思いました。なぜ違いますか。」'),
    ('物理', '電気回路（直列/並列）', '質問例: 「直列回路では電流が分かれると考えました。なぜ違いますか。」'),
    ('物理', '波の重ね合わせ', '質問例: 「同振幅で逆位相でも強め合うところができると思いました。なぜ違いますか。」'),
    ('物理', 'レンズ', '質問例: 「凹レンズでもスクリーンに実像を結べると思いました。なぜ違いますか。」'),
    ('物理', '気体の状態', '質問例: 「圧力を2倍にすれば温度も必ず2倍になると思いました。なぜ違いますか。」'),
    ('化学', 'モル計算', '質問例: 「水 18 g は数値が同じなので 18 mol だと思いました。なぜ違いますか。」'),
    ('化学', '希釈', '質問例: 「2.0 M 溶液に同量の水を加えてもモル数は変わらないので濃度も同じだと思いました。なぜ違いますか。」'),
    ('化学', '酸・塩基', '質問例: 「酢酸 0.10 M も強酸と同じように完全電離するので pH は 1.0 くらいだと思いました。なぜ違いますか。」'),
    ('化学', '酸化還元', '質問例: 「酸化剤は電子を与える物質だと覚えました。なぜ違いますか。」'),
    ('化学', '化学平衡（圧力）', '質問例: 「N2+3H2⇄2NH3 は圧力を上げても平衡は変わらないと思いました。なぜ違いますか。」'),
    ('化学', '反応速度', '質問例: 「温度を上げると活性化エネルギーが大きくなるので反応は遅くなると思いました。なぜ違いますか。」'),
    ('化学', '有機（官能基）', '質問例: 「酢酸の主要な官能基はカルボニル基 (C=O) だと思いました。なぜ違いますか。」'),
    ('化学', '溶解度積/共通イオン', '質問例: 「AgCl に Cl^- を加えるほど溶解度は増えると思いました。なぜ違いますか。」'),
    ('英語', '時制：過去完了 vs 現在完了', '質問例: 「When I arrived at the station, the train has left と書いたのですが、“さっき出たばかり”という感じを出したかっただけです。なぜ違いますか。」'),
    ('英語', '仮定法過去（If I were）', '質問例: 「If I was you, I would take the test again. と書きました。“be”の過去だから was で良いと思ったのですが、なぜ違いますか。」'),
    ('英語', '混合仮定法', '質問例: 「If I had studied harder, I would pass the exam. と書きました。なぜ違いますか。」'),
    ('英語', '分詞構文／ぶら下がり分詞', '質問例: 「Walking along the street, the car hit me. と書きました。“歩いていたのは私”のつもりですが、なぜ違いますか。」'),
    ('英語', '関係詞の使い分け', '質問例: 「My father, that is a doctor, works in Osaka. と書きました。that はいつでも使えると思ったのですが、なぜ違いますか。」'),
    ('英語', '動名詞と不定詞', '質問例: 「I enjoy to swim. と書きました。to不定詞で問題ないと思ったのですが、なぜ違いますか。」'),
    ('英語', '冠詞／無冠詞（慣用的施設名）', '質問例: 「I go to the school every day. と書きました。“自分の通う学校”という特定を示したかったのですが、なぜ違いますか。」'),
    ('英語', '主語と動詞の一致', '質問例: 「Everyone have their own laptop. と書きました。“みんな”だから複数で have にしたのですが、なぜ違いますか。」')
)
INSERT INTO "topics" (id, subject_id, name, description)
SELECT gen_random_uuid(), s.id, topic_data.topic_name, topic_data.topic_description
FROM topic_data
JOIN subjects s ON s.name = topic_data.subject_name
ON CONFLICT (subject_id, name)
DO UPDATE SET description = EXCLUDED.description;
