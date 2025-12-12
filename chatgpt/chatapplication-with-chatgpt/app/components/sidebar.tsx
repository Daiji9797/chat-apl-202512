"use client";

import { Timestamp, query, orderBy, onSnapshot , collection, addDoc, serverTimestamp, deleteDoc, doc, getDocs, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { FaTrash } from "react-icons/fa";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAppContext } from "../context/appcontext";

/**
 * チャットルームの型定義
 * @property {string} id - ルームのID
 * @property {string} name - ルームの名前
 * @property {Timestamp} createdAt - ルームの作成日時
 */
type Room = {
    id: string;
    name: string;
    createdAt: Timestamp;
};

/**
 * サイドバーコンポーネント
 * チャットルームの一覧表示、新規ルーム作成、ルーム削除、ログアウト機能を提供します。
 * リアルタイムでチャットルームの一覧を監視し、更新を反映します。
 */
const Sidebar = () => {
    const { user, userid, setUser, selectedRoom, setSelectedRoom, setSelectedRoomName } = useAppContext();
    
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();

    /**
     * ログアウト処理
     * Firebaseからサインアウトし、ログインページにリダイレクトします。
     */
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/auth/login");
        } catch (error) {
            console.error("ログアウトエラー:", error);
        }
    };

    /**
     * チャットルーム削除処理
     * 指定されたチャットルームをFirestoreから削除します。
     * 削除前に確認ダイアログを表示します。
     * @param {string} roomId - 削除するルームのID
     * @param {React.MouseEvent} e - クリックイベント（イベント伝播を停止するため）
     */
    const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!confirm("このチャットルームを削除しますか？")) return;
        
        try {
            await deleteDoc(doc(db, "rooms", roomId));
            if (selectedRoom === roomId) {
                setSelectedRoom(null);
                setSelectedRoomName(null);
            }
        } catch (error) {
            console.error("削除エラー:", error);
            alert("チャットルームの削除に失敗しました");
        }
    };

    /**
     * 新規チャットルーム作成処理
     * 入力されたルーム名でチャットルームをFirestoreに作成します。
     * 同じ名前のルームが存在する場合はエラーメッセージを表示します。
     */
    const handleCreateRoom = async () => {
        if (newRoomName.trim() === "") return;
        
        try {
            // 重複チェック
            const roomsCollectionRef = collection(db, "rooms");
            const q = query(roomsCollectionRef, where("name", "==", newRoomName.trim()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setErrorMessage("同じ名前のチャットルームが既に存在します");
                return;
            }
            
            const newRoom = {
                name: newRoomName,
                createdAt: serverTimestamp(),
                createdBy: userid,
            };
            await addDoc(roomsCollectionRef, newRoom);
            setNewRoomName("");
            setErrorMessage("");
            setIsModalOpen(false);
        } catch (error) {
            console.error("部屋作成エラー:", error);
            setErrorMessage("チャットルームの作成に失敗しました");
        }
    };

    /**
     * チャットルーム一覧をリアルタイムで取得
     * Firestoreからチャットルームの一覧を購読し、作成日時の降順で取得します。
     */
    useEffect(() => {
        // ユーザーが認証されていない場合はクエリを実行しない
        if (!user || !userid) {
            return;
        }

        const roomsCollectionRef = collection(db, "rooms");
        const q = query(roomsCollectionRef , orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newRooms: Room[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.data().name,
                createdAt: doc.data().createdAt,
            }));
            setRooms(newRooms);
        }, (error) => {
            console.error("Firestore読み取りエラー:", error);
        });

        return () => unsubscribe();
    }, [user, userid]);

    return (
        <div className="bg-gray-800 h-full p-4 flex flex-col">
            <div className="flex-grow">
                <div 
                    onClick={() => setIsModalOpen(true)}
                    className="cursor-pointer flex justify-center items-center border mt-2 p-2 rounded text-white hover:bg-gray-700"
                >
                    + 新規チャット
                </div>
                <ul>
                    {rooms.map((room) => (
                        <li 
                            key={room.id} 
                            onClick={() => {
                                console.log("ルームをクリック:", room.id, room.name);
                                setSelectedRoom(room.id);
                                setSelectedRoomName(room.name);
                                console.log("設定後の確認");
                            }}
                            className={`cursor-pointer text-white p-2 rounded hover:bg-gray-700 mt-2 flex justify-between items-center ${
                                selectedRoom === room.id ? "bg-gray-700" : ""
                            }`}
                        >
                            <span>{room.name}</span>
                            <button
                                onClick={(e) => handleDeleteRoom(room.id, e)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-gray-600"
                                title="削除"
                            >
                                <FaTrash size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">新しいチャットルーム</h2>
                        {errorMessage && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                                {errorMessage}
                            </div>
                        )}
                        <input
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
                            placeholder="部屋名を入力"
                            className="w-full border-2 border-gray-300 rounded p-2 mb-4 focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setNewRoomName("");
                                    setErrorMessage("");
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleCreateRoom}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                作成
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="border-t border-gray-700 pt-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 text-white p-2 rounded hover:bg-gray-700 transition"
                >
                    <BiLogOut size={20} />
                    <span>ログアウト</span>
                </button>
            </div>
        </div>

    );
}
export default Sidebar;