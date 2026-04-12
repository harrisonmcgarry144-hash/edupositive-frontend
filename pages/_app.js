import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { ThemeProvider } from "../context/ThemeContext";
import Layout from "../components/Layout";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>EduPositive</title>
<link rel="icon" href="/favicon-256.png" type="image/png" />
<link rel="icon" type="image/png" sizes="256x256" href="/favicon-256.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
