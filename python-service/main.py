from fastapi import FastAPI, UploadFile, File, HTTPException
import pymupdf

app = FastAPI()


@app.get("/")
def home():
    return {"message": "TalentIQ PDF Extraction Service is running"}


# Extract page text and insert associated hyperlink URLs using their coordinates.
def extract_page_text(page):
    page_dict = page.get_text("rawdict", sort=True)

    lines = []
    all_chars = []

    # Extract characters with their bounding boxes.
    for block in page_dict["blocks"]:
        if block.get("type") != 0:
            continue

        for line in block["lines"]:
            line_chars = []
            line_id = len(lines)

            for span in line["spans"]:
                for char in span["chars"]:
                    char_info = {
                        "text": char["c"],
                        "rect": pymupdf.Rect(char["bbox"]),
                        "position": (line_id, len(line_chars)),
                    }

                    line_chars.append(char_info)
                    all_chars.append(char_info)

            lines.append(line_chars)

    # Associate hyperlinks with the characters they cover.
    insertions = {}

    for link in page.get_links():
        url = link.get("uri")

        if not url:
            continue

        link_rect = pymupdf.Rect(link["from"])
        matched_chars = []

        for char in all_chars:
            rect = char["rect"]

            center = pymupdf.Point(
                (rect.x0 + rect.x1) / 2,
                (rect.y0 + rect.y1) / 2,
            )

            if link_rect.contains(center):
                matched_chars.append(char)

        # Fallback to the character with the greatest overlap.
        if not matched_chars:
            best_char = None
            best_overlap = 0

            for char in all_chars:
                intersection = char["rect"] & link_rect

                if intersection.is_empty:
                    continue

                overlap = intersection.get_area()

                if overlap > best_overlap:
                    best_overlap = overlap
                    best_char = char

            if best_char:
                matched_chars.append(best_char)

        if not matched_chars:
            continue

        last_char = max(
            matched_chars,
            key=lambda char: char["position"],
        )

        position = last_char["position"]

        if position not in insertions:
            insertions[position] = []

        insertions[position].append(url)

    # Reconstruct text and insert URLs inline.
    extracted_lines = []

    for line_chars in lines:
        line_text = ""

        for char in line_chars:
            line_text += char["text"]

            if char["position"] in insertions:
                for url in insertions[char["position"]]:
                    line_text += f" ({url})"

        extracted_lines.append(line_text)

    return "\n".join(extracted_lines)


# Receive a PDF, extract its text and hyperlinks, and return the combined text.
# Extract text from PDF
@app.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    pdf_bytes = await file.read()

    try:
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:

            extracted_pages = []

            for page in doc:
                text = extract_page_text(page)
                extracted_pages.append(text)

            return {
                "text": "\n".join(extracted_pages)
            }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF",
        )
