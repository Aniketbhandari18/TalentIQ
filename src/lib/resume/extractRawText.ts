import PDFParser from "pdf2json";

export async function extractRawText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.once(
      "pdfParser_dataError",
      (err: Error | { parserError: Error }) => {
        console.error("PDF parsing error:", err);
        const errorObj = "parserError" in err ? err.parserError : err;
        reject(new Error(errorObj?.message || "Failed to parse PDF"));
      },
    );

    pdfParser.once("pdfParser_dataReady", () => {
      const rawText = pdfParser.getRawTextContent();
      resolve(rawText);
    });

    pdfParser.parseBuffer(buffer);
  });
}
