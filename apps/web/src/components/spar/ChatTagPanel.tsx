"use client";

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Sparkles } from 'lucide-react';

import type { ChatTagItem, TagMasteryItem, TagSummary, TagTypeItem } from '@/lib/api/tags';

const MASTERY_PRESETS: { label: string; value: number }[] = [
  { label: '要復習', value: 0.2 },
  { label: '再確認', value: 0.5 },
  { label: '理解', value: 0.8 },
];

type Props = {
  tagTypes: TagTypeItem[];
  tags: ChatTagItem[];
  availableTags: TagSummary[];
  masteryMap: Record<string, TagMasteryItem | undefined>;
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  onAddTag: (tagId: string) => Promise<void> | void;
  onRemoveTag: (tagId: string) => Promise<void> | void;
  onUpdateMastery: (tagId: string, score: number) => Promise<void> | void;
};

export default function ChatTagPanel({ tagTypes, tags, availableTags, masteryMap, loading = false, busy = false, error, onAddTag, onRemoveTag, onUpdateMastery }: Props) {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const typeMap = useMemo(() => {
    const map = new Map<number, TagTypeItem>();
    tagTypes.forEach((t) => map.set(t.id, t));
    return map;
  }, [tagTypes]);

  const masteryFor = (tagId: string) => masteryMap[tagId];

  const addTag = async () => {
    if (!selectedTagId || busy) return;
    setLocalError(null);
    try {
      await onAddTag(selectedTagId);
      setSelectedTagId('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'タグの追加に失敗しました';
      setLocalError(message);
    }
  };

  const handleRemove = async (tagId: string) => {
    if (busy) return;
    setLocalError(null);
    try {
      await onRemoveTag(tagId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'タグの削除に失敗しました';
      setLocalError(message);
    }
  };

  const handleMastery = async (tagId: string, value: number) => {
    if (busy) return;
    setLocalError(null);
    try {
      await onUpdateMastery(tagId, value);
    } catch (err) {
      const message = err instanceof Error ? err.message : '理解度の更新に失敗しました';
      setLocalError(message);
    }
  };

  const effectiveError = error ?? localError;

  return (
    <div className="h-full flex flex-col backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-gray-700">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">タグ / 誤解ポイント</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500">読み込み中...</div>
        ) : tags.length === 0 ? (
          <div className="text-sm text-gray-500">まだタグが付与されていません。</div>
        ) : (
          <div className="space-y-4">
            {tags.map((tag) => {
              const type = tag.tagTypeId != null ? typeMap.get(tag.tagTypeId) : undefined;
              const mastery = masteryFor(tag.tagId);
              const masteryPercent = typeof mastery?.masteryScore === 'number' ? Math.round(mastery.masteryScore * 100) : null;
              const confidencePercent = Math.round((tag.confidence ?? 0) * 100);
              return (
                <motion.div
                  key={tag.tagId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 backdrop-blur-xl bg-white/10 border border-white/20 shadow-inner space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{tag.name ?? 'タグ'}</div>
                      <div className="text-xs text-gray-500 space-x-2 mt-1">
                        {type && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 border border-blue-400/30 text-[10px]">{type.label}</span>}
                        <span>付与: {tag.assignedBy}</span>
                        <span>信頼度: {confidencePercent}%</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(tag.tagId)}
                      disabled={busy}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">理解度:</span>
                    <span className="text-sm font-medium text-gray-800">{masteryPercent != null ? `${masteryPercent}%` : '未評価'}</span>
                    <div className="flex gap-2">
                      {MASTERY_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleMastery(tag.tagId, preset.value)}
                          disabled={busy}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                            Math.abs((mastery?.masteryScore ?? -1) - preset.value) < 0.05
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-700'
                              : 'border-white/30 bg-white/10 text-gray-600 hover:bg-white/20'
                          } disabled:opacity-50`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-gray-500">タグを追加</label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-50"
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              disabled={busy || availableTags.length === 0}
            >
              <option value="">選択してください</option>
              {availableTags.map((tag) => {
                const type = typeMap.get(tag.tagTypeId);
                return (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}{type ? ` / ${type.label}` : ''}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={addTag}
              disabled={busy || !selectedTagId}
              className="px-3 py-2 rounded-xl bg-blue-500/90 text-white text-sm flex items-center gap-1 shadow-lg shadow-blue-500/30 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> 追加
            </button>
          </div>
          {availableTags.length === 0 && !loading && (
            <div className="text-xs text-gray-500">利用可能なタグがありません。</div>
          )}
        </div>
        {effectiveError && (
          <div className="text-xs text-red-500">{effectiveError}</div>
        )}
      </div>
    </div>
  );
}
