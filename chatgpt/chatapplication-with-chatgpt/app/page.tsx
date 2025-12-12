"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Sidebar from "./components/sidebar";
import Chat from "./components/chat"; 

/**
 * ホームページコンポーネント（メインページ）
 * ユーザーの認証状態を監視し、認証済みユーザーにはチャットUIを表示します。
 * 未認証の場合はログインページにリダイレクトします。
 * サイドバーとチャットエリアの2カラムレイアウトを提供します。
 */
export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  /**
   * 認証状態を監視
   * Firebaseの認証状態の変化を監視し、未認証ユーザーをログインページにリダイレクトします。
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
        setLoading(false);
      } else {
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="w-64 h-full border-r">
        <Sidebar />
      </div>
      <div className="flex-1 h-full">
        <Chat />
      </div>
    </div>
  );
}
