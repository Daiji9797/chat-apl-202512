"use client";

import { serverTimestamp, Timestamp, doc, collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { db } from "../firebase";
import { useAppContext } from "../context/appcontext";

/**
 * メッセージの型定義
 * @property {string} id - メッセージのID
 * @property {string} text - メッセージの本文
 * @property {"user" | "bot"} sender - 送信者のタイプ
 * @property {Timestamp} createdAt - メッセージの作成日時
 */
type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    createdAt: Timestamp;
};  

/**
 * チャットコンポーネント
 * 選択されたチャットルームのメッセージを表示し、新しいメッセージの送信を処理します。
 * リアルタイムでメッセージの更新を監視し、自動スクロールを行います。
 */
const Chat = () => {
    const { selectedRoom, selectedRoomName, user, userid } = useAppContext();
    const [inputMessage, setInputMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    /**
     * チャットルームのメッセージをリアルタイムで取得
     * 選択されたルームが変更されるたびに、Firestoreからメッセージを取得します。
     */
    useEffect(() => {
        // ユーザーが認証されていない場合はクエリを実行しない
        if (!user || !userid) {
            console.log("ユーザーが認証されていません");
            setMessages([]);
            return;
        }

        if (selectedRoom) {
            console.log("選択されたルーム:", selectedRoom, selectedRoomName);
            const roomDocRef = doc(db, "rooms", selectedRoom);
            const massagesCollectionRef = collection(roomDocRef, "massages");
            const q = query(massagesCollectionRef, orderBy("createdAt", "asc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log("メッセージ数:", snapshot.docs.length);
                const newMessages: Message[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    text: doc.data().text,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                }));
                setMessages(newMessages);
            }, (error) => {
                console.error("Firestoreメッセージ読み取りエラー:", error);
            });
            return () => unsubscribe();
        } else {
            console.log("ルームが選択されていません");
            setMessages([]);
        }
    }, [selectedRoom, user, userid]);

    /**
     * メッセージが更新されるたびに自動スクロール
     * 新しいメッセージが追加されると、チャット画面の最下部にスクロールします。
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /**
     * メッセージ送信処理
     * 入力されたメッセージをFirestoreに保存し、AI応答を取得します。
     */
    const sendMessage = async () => {
        if (!user || !userid || !selectedRoom || inputMessage.trim() === "") return;
        
        const userMessageText = inputMessage;
        setInputMessage("");
        
        try {
            // ユーザーメッセージを保存
            const messageData = {
                text: userMessageText,
                sender: "user",
                createdAt: serverTimestamp(),
            };
            
            const roomDocRef = doc(db, "rooms", selectedRoom);
            const massagesCollectionRef = collection(roomDocRef, "massages");
            await addDoc(massagesCollectionRef, messageData);
            
            // AI応答を取得
            await fetchAIResponse(userMessageText);
        } catch (error) {
            console.error("メッセージ送信エラー:", error);
        }
    };

    /**
     * OpenAIからの応答を取得してメッセージとして追加する関数
     * API Routeを経由してサーバーサイドでOpenAI APIを呼び出します。
     * @param {string} userMessage - ユーザーが送信したメッセージ
     */
    const fetchAIResponse = async (userMessage: string) => {
        try {
            // API Routeを呼び出し
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: userMessage }),
            });
            
            if (!response.ok) {
                throw new Error("API呼び出しに失敗しました");
            }
            
            const data = await response.json();
            
            // AI応答をFirestoreに保存
            const aiMessageData = {
                text: data.response,
                sender: "bot",
                createdAt: serverTimestamp(),
            };
            const roomDocRef = doc(db, "rooms", selectedRoom!);
            const massagesCollectionRef = collection(roomDocRef, "massages");
            await addDoc(massagesCollectionRef, aiMessageData);
        } catch (error) {
            console.error("AI応答取得エラー:", error);
            // エラー時もメッセージを保存
            const errorMessageData = {
                text: "申し訳ありませんが、AI応答の取得に失敗しました。",
                sender: "bot",
                createdAt: serverTimestamp(),
            };
            const roomDocRef = doc(db, "rooms", selectedRoom!);
            const massagesCollectionRef = collection(roomDocRef, "massages");
            await addDoc(massagesCollectionRef, errorMessageData);
        }
    };
    

    return (
        <div className="bg-gray-500 h-full p-4 flex flex-col">
            <h1 className="text-2xl text-white font-semibold mb-4">
                {selectedRoomName || "チャットルームを選択してください"}
            </h1>
            <div className="flex-grow bg-white rounded-lg p-4 overflow-auto mb-4">
                {messages.length === 0 && selectedRoom && (
                    <div className="text-gray-400 text-center mt-8">
                        メッセージがありません。最初のメッセージを送信してください。
                    </div>
                )}
                {messages.map((message) => (
                    <div 
                        key={message.id}
                        className={`mb-4 ${message.sender === "user" ? "text-right" : "text-left"}`}
                    >
                        <div 
                            className={`inline-block p-3 rounded-lg max-w-[70%] ${
                                message.sender === "user" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-200 text-gray-800"
                            }`}
                        >
                            <p className="break-words">{message.text}</p>
                            {message.createdAt && (
                                <span className="text-xs opacity-70 mt-1 block">
                                    {new Date(message.createdAt.seconds * 1000).toLocaleTimeString('ja-JP', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="flex-shrink-0 relative">
                <input 
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="border-2 rounded w-full pr-10 focus:outline-none p-2" 
                    placeholder="send a message" 
                />
                <button 
                    onClick={sendMessage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                >
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );  
}

export default Chat;