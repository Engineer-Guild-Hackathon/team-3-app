/**
 * 404 ページ（App Router 用の簡易版）
 * - pages/_document は使用せず、通常のコンポーネントのみを返す
 */
export default function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>ページが見つかりません</h1>
      <p style={{ marginTop: 8 }}>お探しのページは存在しないか、移動した可能性があります。</p>
    </div>
  );
}

