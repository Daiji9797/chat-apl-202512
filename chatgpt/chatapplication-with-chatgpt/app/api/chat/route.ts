import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

/**
 * OpenAI Chat API Route
 * クライアントからのリクエストを受け取り、OpenAI APIを呼び出して応答を返します。
 */
export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "メッセージが必要です" },
                { status: 400 }
            );
        }

        // OpenAIクライアントの初期化（サーバーサイドのみ）
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // OpenAI APIを呼び出し
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: message }
            ],
        });

        const aiResponse = response.choices[0].message?.content || "申し訳ありませんが、応答を生成できませんでした。";

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("OpenAI API エラー:", error);
        return NextResponse.json(
            { error: "AI応答の生成に失敗しました" },
            { status: 500 }
        );
    }
}
