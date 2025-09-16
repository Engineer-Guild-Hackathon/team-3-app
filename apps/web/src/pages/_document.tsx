// pages ルーター用の最小 Document（App Router 併用時のビルド安定化）
// Html/Head/Main/NextScript は pages/_document 内でのみ使用可
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

