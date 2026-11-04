"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

type UploadedFile = {
  name: string;
  path: string;
  size: number;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  async function handleUpload() {
    const start = Date.now();
    if (!user) return;

    if (!files.length) {
      alert("Please select resumes");
      return;
    }

    if (files.length > 500) {
      alert("Maximum 500 PDFs allowed");
      return;
    }

    try {
      setLoading(true);

      const uploadedFiles: UploadedFile[] = [];
      const failedFiles: string[] = [];

      // Upload PDFs in batches of 10
      const BATCH_SIZE = 10;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batchFiles = files.slice(i, i + BATCH_SIZE);

        // 1. Request batch tokens with ONE API call per batch of 10
        const res = await fetch("/api/storage/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileNames: batchFiles.map((f) => f.name),
          }),
        });

        const { tokens, error: batchError } = await res.json();
        if (batchError || !tokens)
          throw new Error(batchError || "Failed to get tokens");

        // 2. Upload all 10 files in parallel directly to Supabase using their respective tokens
        const results = await Promise.all(
          batchFiles.map(async (file, index) => {
            const tokenData = tokens[index];
            if (!tokenData) return null;

            const { data, error } = await supabase.storage
              .from("Resumes")
              .uploadToSignedUrl(tokenData.path, tokenData.token, file, {
                contentType: file.type,
                upsert: false,
              });

            if (error || !data) {
              console.error(`Upload failed: ${file.name}`, error);
              return null;
            }

            console.log("data:", data);

            return {
              name: file.name,
              path: data.path,
              size: file.size,
            };
          }),
        );

        // uploadedFiles.push(
        //   ...results.filter((file): file is UploadedFile => file !== null),
        // );
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result) {
            uploadedFiles.push(result);
          } else {
            failedFiles.push(batchFiles[j].name);
          }
        }
      }

      // Send only storage paths and metadata to backend
      if (uploadedFiles.length > 0) {
        const response = await fetch("/api/upload/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: uploadedFiles,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to register resumes");
        }

        console.log("Processing started:", data);
      }

      alert(
        `${uploadedFiles.length} uploaded successfully. ${failedFiles.length} failed.`,
      );

      setFiles([]);

      console.log("Time taken:", Date.now() - start);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={(e) => {
          setFiles(Array.from(e.target.files || []));
        }}
      />

      <p>Selected: {files.length} PDFs</p>

      <Button onClick={handleUpload} disabled={!files.length || loading}>
        {loading ? "Processing..." : "Upload Resume"}
      </Button>
    </div>
  );
}
