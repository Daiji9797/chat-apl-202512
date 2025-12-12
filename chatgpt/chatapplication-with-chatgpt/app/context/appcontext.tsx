"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

/**
 * アプリケーション全体の状態管理用Contextファイル
 * ユーザー認証情報、選択中のチャットルーム情報をグローバルに管理します。
 */

/**
 * AppProviderコンポーネントのプロパティ型定義
 */
type AppProviderProps = {
    children: React.ReactNode;
};

/**
 * アプリケーションコンテキストの型定義
 * @property {User | null} user - 現在のFirebaseユーザーオブジェクト
 * @property {string | null} userid - 現在のユーザーID
 * @property {Function} setUser - ユーザー状態を更新する関数
 * @property {string | null} selectedRoom - 選択中のチャットルームID
 * @property {Function} setSelectedRoom - 選択中のチャットルームIDを更新する関数
 * @property {string | null} selectedRoomName - 選択中のチャットルーム名
 * @property {Function} setSelectedRoomName - 選択中のチャットルーム名を更新する関数
 */
type AppContextType = {
    user: User | null;
    userid: string | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    selectedRoom: string | null;
    setSelectedRoom: React.Dispatch<React.SetStateAction<string | null>>;
    selectedRoomName: string | null;
    setSelectedRoomName: React.Dispatch<React.SetStateAction<string | null>>;
};

const defaultContextData: AppContextType = {
    user: null,
    userid: null,
    setUser: () => {},
    selectedRoom: null,
    setSelectedRoom: () => {},
    selectedRoomName: null,
    setSelectedRoomName: () => {},
};

// アプリケーションコンテキストの作成
const AppContext = createContext<AppContextType>(defaultContextData);

/**
 * アプリケーションコンテキストプロバイダー
 * アプリケーション全体で使用する状態（ユーザー情報、選択中のルーム情報）を提供します。
 * Firebase認証の状態変化を監視し、自動的にユーザー情報を更新します。
 * @param {AppProviderProps} props - children要素を含むプロパティ
 */
export function AppProvider({ children }: AppProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userid, setUserid] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

    /**
     * Firebase認証状態を監視
     * ユーザーのログイン/ログアウトを検知し、状態を更新します。
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (newUser) => {
            setUser(newUser);
            setUserid(newUser ? newUser.uid : null);
        });
        return () => {
            unsubscribe();
        };
    }, []);
    
    return (
        <AppContext.Provider value={{ user, userid, setUser, selectedRoom, setSelectedRoom, selectedRoomName, setSelectedRoomName }}>
            {children}
        </AppContext.Provider>
    );
}

/**
 * アプリケーションコンテキストを利用するためのカスタムフック
 * コンポーネント内でユーザー情報や選択中のルーム情報にアクセスするために使用します。
 * @returns {AppContextType} アプリケーションコンテキストの値
 */
export function useAppContext() {
    return useContext(AppContext);
}