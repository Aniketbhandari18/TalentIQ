import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Server-side client initialized with the SECRET key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { fileNames }: { fileNames: string[] } = await req.json();

    if (!fileNames || !fileNames.length) {
      return NextResponse.json(
        { error: "File names are required" },
        { status: 400 },
      );
    }

    const tokenPromises = fileNames.map(async (fileName) => {
      const filePath = `${userId}/${crypto.randomUUID()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from("Resumes")
        .createSignedUploadUrl(filePath);

      if (error || !data) {
        throw new Error(`Failed for ${fileName}: ${error?.message}`);
      }

      return {
        fileName,
        path: data.path,
        token: data.token,
        signedUrl: data.signedUrl,
      };
    });

    const results = await Promise.all(tokenPromises);

    return NextResponse.json({ tokens: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
