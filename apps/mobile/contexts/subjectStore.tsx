import * as React from "react";

export type SubjectTopic = {
  id: string;
  label: string;
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
      { id: "algebra", label: "代数" },
      { id: "geometry", label: "幾何" },
      { id: "calculus", label: "解析" },
    ],
  },
  {
    id: "science",
    label: "理科",
    topics: [
      { id: "physics", label: "物理" },
      { id: "chemistry", label: "化学" },
      { id: "biology", label: "生物" },
    ],
  },
  {
    id: "society",
    label: "社会",
    topics: [
      { id: "history", label: "歴史" },
      { id: "geography", label: "地理" },
      { id: "civics", label: "公民" },
      { id: "ethics", label: "倫理" },
      { id: "politics", label: "政治・経済" },
      { id: "worldHistory", label: "世界史" },
      { id: "japaneseHistory", label: "日本史" },
      { id: "modernSociety", label: "現代社会" },
      { id: "ethicsCivics", label: "倫理・政治・経済" },
      { id: "geographyHistory", label: "地理・歴史" },
      { id: "geographyCivics", label: "地理・公民" },
      { id: "historyCivics", label: "歴史・公民" },
    ],
  },
  {
    id: "language",
    label: "国語",
    topics: [
      { id: "reading", label: "読解" },
      { id: "composition", label: "作文" },
      { id: "literature", label: "文学" },
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
