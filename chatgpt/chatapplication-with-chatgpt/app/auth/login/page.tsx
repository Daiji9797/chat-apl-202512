"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form"; 

type LoginFormData = {
    email: string;
    password: string;
};

const LoginPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>();
    
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const onSubmit = async (data: LoginFormData) => {
        setError("");

        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            router.push("/");
        } catch (err: any) {
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("メールアドレスまたはパスワードが正しくありません");
            } else if (err.code === "auth/invalid-email") {
                setError("有効なメールアドレスを入力してください");
            } else if (err.code === "auth/invalid-credential") {
                setError("メールアドレスまたはパスワードが正しくありません");
            } else {
                setError("ログインに失敗しました。もう一度お試しください");
            }
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
            <form 
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
            > 
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">ログイン</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        メールアドレス
                    </label>
                    <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 ${
                            errors.email ? "border-red-500" : ""
                        }`}
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        {...register("email", {
                            required: "メールアドレスを入力してください",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "有効なメールアドレスを入力してください"
                            }
                        })}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs italic mt-1">{errors.email.message}</p>
                    )}
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        パスワード
                    </label>
                    <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 ${
                            errors.password ? "border-red-500" : ""
                        }`}
                        id="password"
                        type="password"
                        placeholder="パスワード"
                        {...register("password", {
                            required: "パスワードを入力してください",
                            minLength: {
                                value: 6,
                                message: "パスワードは6文字以上で入力してください"
                            }
                        })}
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs italic mt-1">{errors.password.message}</p>
                    )}
                </div>
                
                <div className="mb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                    >
                        {isSubmitting ? "ログイン中..." : "ログイン"}
                    </button>
                </div>
                
                <div className="text-center">
                    <span className="text-gray-600 text-sm">アカウントをお持ちでないですか？</span>
                    <Link 
                        href="/auth/register"
                        className="ml-2 text-blue-500 hover:text-blue-700 font-semibold text-sm"
                    >
                        新規登録
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
