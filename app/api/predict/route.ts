import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
      console.error("❌ 错误：未在 .env.local 中找到 REPLICATE_API_TOKEN");
      return NextResponse.json({ error: "Token Missing" }, { status: 500 });
    }

    const replicate = new Replicate({ auth: token });

    console.log("🚀 正在发送照片到 AI 服务器...");

    // 换一个更轻量稳定的模型：GFPGAN (人脸修复/推演)
    const output = await replicate.run(
      "tencentarc/gfpgan:9283bedc511621f3a6a77917c5965e993095c6129a4ac176212d40560b30648b",
      {
        input: {
          img: image,
          version: "v1.4",
          upscale: 2,
        }
      }
    );

    console.log("✅ AI 生成成功！");
    return NextResponse.json({ result: output });

  } catch (error: any) {
    console.error("❌ AI 后端发生故障:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}