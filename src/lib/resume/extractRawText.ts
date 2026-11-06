export async function extractRawText(blob: Blob) {
  const formData = new FormData();

  formData.append("file", blob, "resume.pdf");

  const response = await fetch("http://127.0.0.1:8000/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to extract PDF text");
  }

  const data = await response.json();

  if (!data.text?.trim()) {
    throw new Error("No text could be extracted from resume");
  }

  console.log("extracted resume data:", data.text);

  return data.text as string;
}
