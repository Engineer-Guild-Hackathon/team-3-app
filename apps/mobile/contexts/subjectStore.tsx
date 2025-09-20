import * as React from "react";

import { useAuth } from "./auth";

function ensureJson<T>(value: T | Response): T {
  if (value instanceof Response) {
    throw new Error("Unexpected response format");
  }
  return value;
}

export type SubjectTopic = {
  id: string;
  label: string;
  description: string | null;
};

export type SubjectDefinition = {
  id: string;
  label: string;
  topics: SubjectTopic[];
};

export type SubjectSelectionSnapshot = {
  subjectId: string;
  topicIds: string[];
};

export type SubjectStoreValue = {
  subjects: SubjectDefinition[];
  topicsBySubject: Record<string, SubjectTopic[]>;
  selectedSubjectId: string;
  stagedSelections: Record<string, string[]>;
  savedSelections: Record<string, string[]>;
  currentTopics: SubjectTopic[];
  currentTopicIds: string[];
  selectSubject: (subjectId: string) => void;
  setTopicSelection: (subjectId: string, topicId: string, isSelected: boolean) => void;
  saveSubjectSelection: (subjectId?: string) => SubjectSelectionSnapshot | null;
  resetSubjectSelection: (subjectId?: string) => void;
  replaceSubjects: (definitions: SubjectDefinition[]) => void;
  hasUnsavedChanges: boolean;
};

const SUBJECT_DEFINITIONS: SubjectDefinition[] = [
  {
    id: "math",
    label: "数学",
    topics: [
      { id: "math-exponent-log", label: "指数・対数", description: "質問例: 「log2(8x)=5 なので 8x=5 だと思いました。なぜ違いますか。」" },
      { id: "math-product-rule", label: "微分（積の法則）", description: "質問例: 「d/dx(x^2 sin x)=2x sin x で良いと思いました。なぜ違いますか。」" },
      { id: "math-trig-sum", label: "三角関数（加法定理）", description: "質問例: 「cos(α+β)=cosα+cosβ ですよね？ なぜ違いますか。」" },
      { id: "math-geom-series", label: "数列（等比）", description: "質問例: 「1,2,4,8,… の一般項は 2^n-1 だと思いました。なぜ違いますか。」" },
      { id: "math-vector", label: "ベクトル", description: "質問例: 「a・b=0 は平行を意味すると覚えました。なぜ違いますか。」" },
      { id: "math-probability", label: "確率", description: "質問例: 「サイコロ2回で『少なくとも1回1が出る』の確率は 1/6 と同じだと思いました。なぜ違いますか。」" },
      { id: "math-complex", label: "複素数", description: "質問例: 「(1+i)(1-i) は i と -i が打ち消し合うので 0 になると思いました。なぜ違いますか。」" },
      { id: "math-analytic-geometry", label: "解析幾何（円）", description: "質問例: 「x^2+y^2+4x-6y+9=0 は中心が原点の円だと思いました。なぜ違いますか。」" },
    ],
  },
  {
    id: "physics",
    label: "物理",
    topics: [
      { id: "physics-uniform-accel", label: "等加速度直線運動", description: "質問例: 「等加速度でも x=vt で計算できると思い、a=2 m/s^2, t=5 s なら 50 m と出ました。なぜ違いますか。」" },
      { id: "physics-incline", label: "斜面上の力", description: "質問例: 「斜面上では重力 mg がそのまま斜面方向に働くので分解は不要だと思いました。なぜ違いますか。」" },
      { id: "physics-equilibrium", label: "力のつり合い", description: "質問例: 「机の上で静止している物体には力がかかっていないと思いました。なぜ違いますか。」" },
      { id: "physics-collision", label: "衝突", description: "質問例: 「どんな衝突でも運動エネルギーは保存するはずだと思いました。なぜ違いますか。」" },
      { id: "physics-circuit", label: "電気回路（直列/並列）", description: "質問例: 「直列回路では電流が分かれると考えました。なぜ違いますか。」" },
      { id: "physics-wave", label: "波の重ね合わせ", description: "質問例: 「同振幅で逆位相でも強め合うところができると思いました。なぜ違いますか。」" },
      { id: "physics-lens", label: "レンズ", description: "質問例: 「凹レンズでもスクリーンに実像を結べると思いました。なぜ違いますか。」" },
      { id: "physics-gas", label: "気体の状態", description: "質問例: 「圧力を2倍にすれば温度も必ず2倍になると思いました。なぜ違いますか。」" },
    ],
  },
  {
    id: "chemistry",
    label: "化学",
    topics: [
      { id: "chemistry-mole", label: "モル計算", description: "質問例: 「水 18 g は数値が同じなので 18 mol だと思いました。なぜ違いますか。」" },
      { id: "chemistry-dilution", label: "希釈", description: "質問例: 「2.0 M 溶液に同量の水を加えてもモル数は変わらないので濃度も同じだと思いました。なぜ違いますか。」" },
      { id: "chemistry-acid-base", label: "酸・塩基", description: "質問例: 「酢酸 0.10 M も強酸と同じように完全電離するので pH は 1.0 くらいだと思いました。なぜ違いますか。」" },
      { id: "chemistry-redox", label: "酸化還元", description: "質問例: 「酸化剤は電子を与える物質だと覚えました。なぜ違いますか。」" },
      { id: "chemistry-equilibrium", label: "化学平衡（圧力）", description: "質問例: 「N2+3H2⇄2NH3 は圧力を上げても平衡は変わらないと思いました。なぜ違いますか。」" },
      { id: "chemistry-kinetics", label: "反応速度", description: "質問例: 「温度を上げると活性化エネルギーが大きくなるので反応は遅くなると思いました。なぜ違いますか。」" },
      { id: "chemistry-organic", label: "有機（官能基）", description: "質問例: 「酢酸の主要な官能基はカルボニル基 (C=O) だと思いました。なぜ違いますか。」" },
      { id: "chemistry-solubility", label: "溶解度積/共通イオン", description: "質問例: 「AgCl に Cl^- を加えるほど溶解度は増えると思いました。なぜ違いますか。」" },
    ],
  },
  {
    id: "english",
    label: "英語",
    topics: [
      { id: "english-tense", label: "時制：過去完了 vs 現在完了", description: "質問例: 「When I arrived at the station, the train has left と書いたのですが、“さっき出たばかり”という感じを出したかっただけです。なぜ違いますか。」" },
      { id: "english-subjunctive", label: "仮定法過去（If I were）", description: "質問例: 「If I was you, I would take the test again. と書きました。“be”の過去だから was で良いと思ったのですが、なぜ違いますか。」" },
      { id: "english-mixed-conditional", label: "混合仮定法", description: "質問例: 「If I had studied harder, I would pass the exam. と書きました。なぜ違いますか。」" },
      { id: "english-participle", label: "分詞構文／ぶら下がり分詞", description: "質問例: 「Walking along the street, the car hit me. と書きました。“歩いていたのは私”のつもりですが、なぜ違いますか。」" },
      { id: "english-relative", label: "関係詞の使い分け", description: "質問例: 「My father, that is a doctor, works in Osaka. と書きました。that はいつでも使えると思ったのですが、なぜ違いますか。」" },
      { id: "english-gerund-infinitive", label: "動名詞と不定詞", description: "質問例: 「I enjoy to swim. と書きました。to不定詞で問題ないと思ったのですが、なぜ違いますか。」" },
      { id: "english-articles", label: "冠詞／無冠詞（慣用的施設名）", description: "質問例: 「I go to the school every day. と書きました。“自分の通う学校”という特定を示したかったのですが、なぜ違いますか。」" },
      { id: "english-subject-verb", label: "主語と動詞の一致", description: "質問例: 「Everyone have their own laptop. と書きました。“みんな”だから複数で have にしたのですが、なぜ違いますか。」" },
    ],
  },
];

const SubjectStoreContext = React.createContext<SubjectStoreValue | null>(null);

const arrayEquals = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let index = 0; index < sortedA.length; index += 1) {
    if (sortedA[index] !== sortedB[index]) {
      return false;
    }
  }
  return true;
};

const cloneWith = (map: Record<string, string[]>, key: string, next: string[]): Record<string, string[]> => {
  return {
    ...map,
    [key]: next,
  };
};

const ensureArray = (value?: string[]): string[] => (value ? [...value] : []);

export type SubjectStoreProviderProps = {
  children: React.ReactNode;
  subjects?: SubjectDefinition[];
};

const selectFallbackSubjects = (definitions?: SubjectDefinition[]): SubjectDefinition[] => {
  if (definitions && definitions.length > 0) {
    return definitions;
  }
  return SUBJECT_DEFINITIONS;
};

const filterSelectionMap = (
  selections: Record<string, string[]>,
  allowedIds: Set<string>,
): Record<string, string[]> => {
  const next: Record<string, string[]> = {};
  let changed = false;
  Object.entries(selections).forEach(([key, value]) => {
    if (!allowedIds.has(key)) {
      changed = true;
      return;
    }
    next[key] = value;
  });
  return changed ? next : selections;
};

export const SubjectStoreProvider = ({
  children,
  subjects: subjectsProp,
}: SubjectStoreProviderProps) => {
  const { apiClient, isAuthenticated } = useAuth();
  const [subjects, setSubjects] = React.useState<SubjectDefinition[]>(
    () => selectFallbackSubjects(subjectsProp),
  );

  React.useEffect(() => {
    setSubjects(selectFallbackSubjects(subjectsProp));
  }, [subjectsProp]);

  const initialSubjectId = subjects[0]?.id ?? "";
  const topicsBySubject = React.useMemo(() => {
    const map: Record<string, SubjectTopic[]> = {};
    subjects.forEach((subject) => {
      map[subject.id] = subject.topics;
    });
    return map;
  }, [subjects]);

  const [selectedSubjectId, setSelectedSubjectId] = React.useState(initialSubjectId);
  const [savedSelections, setSavedSelections] = React.useState<Record<string, string[]>>({});
  const [stagedSelections, setStagedSelections] = React.useState<Record<string, string[]>>(() => {
    if (!initialSubjectId) {
      return {};
    }
    return {
      [initialSubjectId]: [],
    };
  });

  const currentTopics = React.useMemo(() => {
    return topicsBySubject[selectedSubjectId] ?? [];
  }, [selectedSubjectId, topicsBySubject]);

  const currentTopicIds = React.useMemo(() => {
    if (stagedSelections[selectedSubjectId]) {
      return [...stagedSelections[selectedSubjectId]];
    }
    if (savedSelections[selectedSubjectId]) {
      return [...savedSelections[selectedSubjectId]];
    }
    return [];
  }, [savedSelections, stagedSelections, selectedSubjectId]);

  React.useEffect(() => {
    if (!selectedSubjectId) {
      return;
    }
    setStagedSelections((prev) => {
      if (prev[selectedSubjectId]) {
        return prev;
      }
      const next = ensureArray(savedSelections[selectedSubjectId]);
      return cloneWith(prev, selectedSubjectId, next);
    });
  }, [savedSelections, selectedSubjectId]);

  React.useEffect(() => {
    const allowedIds = new Set(subjects.map((subject) => subject.id));
    setSavedSelections((prev) => filterSelectionMap(prev, allowedIds));
    setStagedSelections((prev) => filterSelectionMap(prev, allowedIds));
    setSelectedSubjectId((prev) => {
      if (prev && allowedIds.has(prev)) {
        return prev;
      }
      return subjects[0]?.id ?? "";
    });
  }, [subjects]);

  const selectSubject = React.useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setStagedSelections((prev) => {
      if (prev[subjectId]) {
        return prev;
      }
      const next = ensureArray(savedSelections[subjectId]);
      return cloneWith(prev, subjectId, next);
    });
  }, [savedSelections]);

  const setTopicSelection = React.useCallback(
    (subjectId: string, topicId: string, isSelected: boolean) => {
      setStagedSelections((prev) => {
        const base = prev[subjectId] ?? ensureArray(savedSelections[subjectId]);
        const nextSet = new Set(base);
        if (isSelected) {
          nextSet.add(topicId);
        } else {
          nextSet.delete(topicId);
        }
        return cloneWith(prev, subjectId, Array.from(nextSet));
      });
    },
    [savedSelections],
  );

  const saveSubjectSelection = React.useCallback(
    (subjectId?: string): SubjectSelectionSnapshot | null => {
      const target = subjectId ?? selectedSubjectId;
      if (!target) {
        return null;
      }
      const staged = stagedSelections[target] ?? ensureArray(savedSelections[target]);
      let snapshot: SubjectSelectionSnapshot | null = null;
      setSavedSelections((prev) => {
        const current = ensureArray(prev[target]);
        const next = ensureArray(staged);
        snapshot = { subjectId: target, topicIds: [...next] };
        if (arrayEquals(current, next)) {
          return prev;
        }
        return cloneWith(prev, target, next);
      });
      setStagedSelections((prev) => cloneWith(prev, target, ensureArray(staged)));
      return snapshot;
    },
    [savedSelections, stagedSelections, selectedSubjectId],
  );

  const resetSubjectSelection = React.useCallback(
    (subjectId?: string) => {
      const target = subjectId ?? selectedSubjectId;
      if (!target) {
        return;
      }
      setStagedSelections((prev) => cloneWith(prev, target, ensureArray(savedSelections[target])));
    },
    [savedSelections, selectedSubjectId],
  );

  const replaceSubjects = React.useCallback((definitions: SubjectDefinition[]) => {
    setSubjects(selectFallbackSubjects(definitions));
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const subjectResponse = await apiClient.send<{ items?: Array<{ id: string; name: string }> }>(
          "/api/v1/subjects",
        );
        const subjectJson = ensureJson(subjectResponse);
        const subjectItems = subjectJson?.items ?? [];
        const nextDefinitions: SubjectDefinition[] = [];

        for (const subject of subjectItems) {
          const topicsResponse = await apiClient.send<{
            items?: Array<{ id: string; name: string; description?: string | null }>;
          }>(`/api/v1/subjects/${subject.id}/topics`);
          const topicsJson = ensureJson(topicsResponse);
          const normalizedTopics = (topicsJson?.items ?? [])
            .map((topic) => ({
              id: topic.id,
              label: topic.name,
              description: topic.description ?? null,
            }))
            .filter((topic) => Boolean(topic.description));

          if (normalizedTopics.length === 0) {
            continue;
          }

          nextDefinitions.push({
            id: subject.id,
            label: subject.name,
            topics: normalizedTopics,
          });
        }

        if (!cancelled && nextDefinitions.length > 0) {
          replaceSubjects(nextDefinitions);
        }
      } catch (error) {
        console.warn("Failed to load subject definitions", error);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [apiClient, isAuthenticated, replaceSubjects]);

  const hasUnsavedChanges = React.useMemo(() => {
    const target = selectedSubjectId;
    const staged = stagedSelections[target] ?? [];
    const saved = savedSelections[target] ?? [];
    return !arrayEquals(staged, saved);
  }, [savedSelections, stagedSelections, selectedSubjectId]);

  const value = React.useMemo<SubjectStoreValue>(() => ({
    subjects,
    topicsBySubject,
    selectedSubjectId,
    stagedSelections,
    savedSelections,
    currentTopics,
    currentTopicIds,
    selectSubject,
    setTopicSelection,
    saveSubjectSelection,
    resetSubjectSelection,
    replaceSubjects,
    hasUnsavedChanges,
  }), [
    currentTopicIds,
    currentTopics,
    hasUnsavedChanges,
    replaceSubjects,
    saveSubjectSelection,
    selectSubject,
    setTopicSelection,
    stagedSelections,
    subjects,
    topicsBySubject,
    savedSelections,
    selectedSubjectId,
    resetSubjectSelection,
  ]);

  return <SubjectStoreContext.Provider value={value}>{children}</SubjectStoreContext.Provider>;
};

export const useSubjectStore = (): SubjectStoreValue => {
  const context = React.useContext(SubjectStoreContext);
  if (!context) {
    throw new Error("useSubjectStore must be used within a SubjectStoreProvider");
  }
  return context;
};
