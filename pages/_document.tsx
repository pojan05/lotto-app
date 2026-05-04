import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta name="theme-color" content="#0a0a12" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
