import { Html, Head, Main, NextScript } from "next/document";
import { Component } from "react";

export default class MyDocument extends Component {
  render() {
    return (
      <Html lang="ko">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#ffffff" />
          {/* viewport meta는 _document.js에서 제거 */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
