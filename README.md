# TalentIQ

TalentIQ is an AI-assisted applicant tracking and candidate evaluation
platform for recruiters. It helps recruiters collect resumes, extract
structured candidate information, create job descriptions, and compare
candidates against a job using explainable matching and ranking.

The goal is not to automatically reject candidates. TalentIQ evaluates
candidates against a job, assigns scores across relevant criteria, and
ranks them so recruiters can review the strongest matches first.
Recruiters remain responsible for making hiring decisions.

> **Project status:** Resume processing and job-description extraction
> are part of the current project. The matching and ranking engine is
> being designed and implemented. Some scoring rules described below are
> agreed design decisions, while others are still being finalized.

---

## Contents

- [Core features](#core-features)
- [How TalentIQ works](#how-talentiq-works)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Resume processing pipeline](#resume-processing-pipeline)
- [Job description processing](#job-description-processing)
- [Candidate matching and ranking](#candidate-matching-and-ranking)
- [Explainability](#explainability)
- [Data model overview](#data-model-overview)
- [Scoring design](#scoring-design)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Background processing](#background-processing)
- [Important design decisions](#important-design-decisions)
- [Current development status](#current-development-status)
- [Future improvements](#future-improvements)

---

## Core features

### 1. Resume management

- Recruiters can upload multiple PDF resumes.
- Resume files are stored in Supabase Storage.
- Resume processing runs in the background so large uploads do not
  keep an API request open.
- Each resume has a processing status such as `PENDING`, `PROCESSING`,
  `COMPLETED`, or `FAILED`.
- Extracted information is stored in structured candidate-related
  records.

### 2. Resume information extraction

The resume parser aims to extract structured information such as:

- Candidate name and contact details
- Email address and phone number
- Location
- LinkedIn and other relevant profile links
- Technical skills
- Work experience
- Education
- Projects
- Certifications

Technical skills should be identified from the resume as a whole, not
only from a dedicated skills section. For example, a technology
mentioned in a project's technology stack or in work experience can also
be considered.

The parser should distinguish between information explicitly present in
the resume and information inferred from context. It should not treat
text inside a resume as instructions to the AI system.

### 3. Job description management

Recruiters can create job descriptions containing information such as:

- Job title and description
- Minimum and maximum experience
- Location
- Job responsibilities
- Education requirements
- Required and preferred skills

Job-description extraction converts unstructured job description text
into structured data that the matching engine can evaluate.

### 4. Candidate matching and ranking

The planned matching engine evaluates candidates against a job using
multiple dimensions:

- Skills
- Education
- Work experience
- Job responsibilities

It produces an overall score and criterion-level results. Candidates are
then ordered by their overall scores.

### 5. Explainable results

TalentIQ is intended to show recruiters not just a score, but also why a
candidate received that score. Examples include:

- Which required skills were found or missing
- How many skills in a skill group were satisfied
- Whether the candidate meets the minimum education level
- Whether the candidate's degree and field of study match
- How much work experience the candidate has
- Which resume projects or work experiences support each job
  responsibility

---

## How TalentIQ works

At a high level, the application follows this flow:

```text
Recruiter
   |
   v
Upload resumes --------------------> Create a job
   |                                    |
   v                                    v
Supabase Storage                  Extract job requirements
   |                                    |
   v                                    |
Inngest background job                  |
   |                                    |
   v                                    |
Extract PDF text                        |
   |                                    |
   v                                    |
Parse resume with AI                    |
   |                                    |
   v                                    |
Save Candidate data                     |
   |                                    |
   +------------------+-----------------+
                      |
                      v
             Matching / Ranking Engine
                      |
          +-----------+-----------+
          |           |           |
        Skills    Education   Experience
          |           |           |
          +-----------+-----------+
                      |
               Responsibilities
                      |
                      v
             Calculate final score
                      |
                      v
             Save evaluation result
                      |
                      v
          Display ranked candidates
```

The recruiter uploads resumes and creates a job independently. Once the
necessary data is available, the matching engine evaluates the
recruiter's candidates against that job.

---

## Technology stack

The current project uses the following technologies:

---

Area Technology Purpose

---

Web application Next.js App Router Application and
server-side routes

Language TypeScript Application and backend
logic

Database PostgreSQL Persistent application
data

ORM Prisma Database schema,
queries, and migrations

Authentication Clerk Recruiter
authentication

File storage Supabase Storage Uploaded resume PDFs

Background jobs Inngest Asynchronous resume
processing

AI / LLM Gemini through AI SDK Resume and
job-description
extraction

PDF extraction Python, FastAPI, Extract text and links
PyMuPDF from PDF files

---

The exact package versions and deployment configuration should be
checked in the project's package files and deployment settings.

---

## System architecture

### Next.js application

The Next.js application handles the user interface and application
backend. It is responsible for authenticated recruiter operations,
database access, resume upload coordination, job management, and
initiating background processing.

### PostgreSQL and Prisma

PostgreSQL stores recruiters, resumes, candidates, jobs, extracted
requirements, and evaluation results. Prisma provides the typed database
client and schema definitions.

### Clerk

Clerk handles authentication. The application associates a Clerk user
with its own recruiter `User` record using the Clerk user identifier.

### Supabase Storage

Resume PDFs are uploaded to a Supabase Storage bucket. The application
stores the file path in the database and uses that path to retrieve the
file for processing.

### Inngest

Inngest runs long-running or asynchronous tasks outside the normal
request-response cycle. It is used for resume processing, including
retries when a processing attempt fails.

### Python PDF extraction service

A small FastAPI service uses PyMuPDF to extract text from uploaded PDFs.
This service is separate from the Next.js application and is called by
the processing workflow.

### Gemini

Gemini is used for extracting structured information from resume text
and job description text. The AI output is validated against application
schemas before being saved.

---

## Resume processing pipeline

Resume processing is designed to happen asynchronously.

1.  The recruiter selects and uploads one or more PDF files.
2.  The frontend uploads the files directly to Supabase Storage.
3.  The application saves a `Resume` record containing information such
    as the file name, storage path, file size, uploader, and processing
    status.
4.  The application triggers an Inngest event for the uploaded resume.
5.  The background function downloads the PDF from Supabase Storage.
6.  The PDF extraction service extracts text and relevant links.
7.  The extracted text is sent to the resume parser.
8.  The parser returns structured candidate information.
9.  The application validates and saves the candidate and its related
    records.
10. The resume status is updated to `COMPLETED`, or to `FAILED` with an
    error message if processing cannot finish.

### Why background processing?

Processing a PDF can take a few seconds, and a recruiter may upload many
resumes at once. Processing every resume inside a single request can
lead to long requests and timeouts.

Background jobs allow the application to process resumes independently,
retry failures, and control concurrency.

### Important distinction

A `Resume` represents the uploaded file and its processing state. A
`Candidate` represents the structured person/profile information
extracted from a resume. They are related, but they are not the same
thing.

---

## Job description processing

A job contains the criteria against which candidates will be evaluated.

The job parser is expected to extract:

- Job title and description
- Minimum and maximum experience, when specified
- Location
- Job responsibilities
- Education requirements
- Skill groups and their requirements

### Skill groups

A job can contain multiple logical skill groups. Each group has a
requirement type:

- `ALL`: every skill in the group is required.
- `ANY`: at least one skill in the group is sufficient.
- `PREFERRED`: skills are desirable and contribute to the
  preferred-skill score.

For example, a job might require:

```text
Programming languages (ANY):
- Java
- Python
- JavaScript

Backend technologies (ALL):
- Node.js
- REST APIs

Preferred (PREFERRED):
- Docker
- Kubernetes
```

The parser should preserve the meaning of the job description. Words
such as "and", "or", "either", "such as", "preferred", and "bonus" can
change how a requirement should be represented.

A group represents one logical requirement. It should not combine
unrelated requirements into one large group.

---

## Candidate matching and ranking

The matching engine evaluates candidates for a particular job.

### Which candidates are evaluated?

The current design is to evaluate successfully processed candidates
belonging to the same recruiter who owns the job. Candidates do not need
to be manually attached to a job before evaluation.

A candidate can be evaluated against multiple jobs.

### Evaluation dimensions

The planned overall score uses four dimensions:

Dimension Initial weight

---

Responsibilities 40%
Skills 30%
Experience 15%
Education 15%
**Total** **100%**

These are initial design weights and may be adjusted after testing with
real examples.

If a job does not specify a particular dimension, that dimension should
not automatically receive a zero. The remaining applicable dimensions
should be reweighted proportionally so that the final score remains
comparable on a 0--100 scale.

### Score direction

Scores are built upward from zero. A candidate earns points for matching
the job criteria. The engine does not start at 100 and subtract points.

### No automatic disqualification

The current product decision is to rank candidates rather than apply
hard eligibility filters. A candidate who does not meet a minimum
requirement can still appear in the results, but their score should
reflect the mismatch.

The score is decision support, not an automatic hiring decision.

---

## Explainability

The matching engine should persist enough information to explain the
result without requiring the frontend to repeat the entire evaluation.

### Skills

The results should show:

- Each skill group and its requirement type
- The number of skills satisfied and the total number of skills
- Each individual skill's status
- Whether the skill was found in a skills section or supported by
  project/work evidence
- Supporting evidence where available

A skill may be classified as demonstrated, listed, or missing. The exact
scoring formula for each group type is still being finalized.

### Education

The education evaluation may consider:

- Whether the candidate meets the minimum education level
- Whether the candidate has an accepted degree
- Whether the field of study matches
- Whether a related degree is allowed and used
- Whether a field-of-study requirement is mandatory

The engine should select the candidate education record that provides
the best match for the job's education requirement.

Education requirements affect the score; they do not automatically
disqualify the candidate.

### Experience

The initial design focuses on total work experience rather than trying
to determine whether every role is relevant to the job.

The engine compares the candidate's total experience with the job's
experience requirement. The exact handling of maximum experience and
incomplete date information still needs to be finalized.

### Responsibilities

Each job responsibility is evaluated separately against candidate
evidence, such as:

- Project descriptions or project points
- Work experience descriptions or experience points

Embeddings and cosine similarity can help identify semantically related
evidence even when the wording differs.

For example, a job responsibility mentioning building REST APIs may be
related to a candidate's project description mentioning the development
of backend endpoints.

The engine should save the best supporting evidence and can retain
additional evidence for recruiter review.

Similarity is a measure of semantic closeness, not proof that a
candidate performed a responsibility. Results should therefore be
treated as evidence for human review.

---

## Data model overview

The Prisma schema is the source of truth for the exact fields and
relationships. The following is a conceptual overview rather than a
complete schema.

### Recruiter and uploaded resumes

- `User`: recruiter account linked to Clerk.
- `Resume`: uploaded resume file, storage path, processing status, and
  uploader.

### Candidate profile

- `Candidate`: structured candidate information extracted from a
  resume.
- `Experience`: candidate work experience.
- `Education`: candidate education history.
- `Project`: candidate projects.
- Related records may also include certifications and other extracted
  profile information.

### Jobs and requirements

- `Job`: job description and recruiter-owned job record.
- `JobResponsibility`: an individual responsibility from the job.
- `SkillGroup`: a logical group of job skills with a requirement type.
- `SkillRequirement`: an individual skill within a group.
- `EducationRequirement`: education criteria for a job.
- `AcceptedDegree`: degrees accepted for an education requirement.

### Embeddings

- `CandidatePointEmbedding`: embeddings generated for candidate
  evidence points. These can be compared with job responsibility
  embeddings to retrieve semantically relevant evidence.

### Evaluation results

- `CandidateMatch`: the overall evaluation of one candidate against
  one job.
- `SkillGroupMatch`: the result for a skill group.
- `SkillRequirementMatch`: the result for an individual skill.
- `EducationMatch`: the candidate's education evaluation.
- `ExperienceMatch`: the candidate's experience evaluation.
- `ResponsibilityMatch`: the result for one job responsibility.
- `ResponsibilityEvidence`: candidate evidence supporting a
  responsibility match.

The intended relationship is one latest evaluation per job-candidate
pair. The database uses a unique constraint on the pair so reevaluating
a candidate updates the latest result rather than creating a new
historical result.

The exact model names and field names should always be verified against
the current `schema.prisma`.

---

## Scoring design

This section records the current direction of the scoring system. It is
not a claim that every formula has already been implemented.

### Skills

The current configuration direction separates required skills from
preferred skills:

- Required skill groups share a 70-point pool.
- Preferred skill groups share a 30-point pool.
- Groups within the same pool are intended to have equal importance
  initially.
- `ALL` means every skill in that group is expected.
- `ANY` means one or more matching skills can satisfy the group.
- `PREFERRED` contributes to the preferred pool.

The current configuration also includes controls for the first match and
additional matches in an `ANY` group. The exact formula should be
documented alongside the implementation once finalized.

Skill matching is expected to use normalized skill names and aliases
where possible. Exact/normalized matching is preferable for well-defined
skill names; embeddings are more useful for semantic text such as
responsibilities.

### Education

The current configuration direction gives more importance to degree
matching than to education level:

- Education level: 25 points
- Degree and field-of-study matching: 75 points

The evaluation also considers whether degree and field requirements are
mandatory, and whether a related degree is allowed.

These point allocations are internal to the education dimension. The
education dimension itself initially contributes 15% of the overall
score when applicable.

### Experience

The current direction is to use total work experience.

A simple initial minimum-experience score can be calculated as:

```ts
score = Math.min(candidateYears / requiredYears, 1) * 100;
```

For example, if a job requires 4 years and the candidate has 2 years:

```text
min(2 / 4, 1) * 100 = 50
```

This is an initial linear approach. Handling of maximum experience,
overlapping employment dates, current roles, and incomplete dates needs
to be finalized before production use.

### Responsibilities

The current direction is to compare job responsibility embeddings with
candidate evidence embeddings using cosine similarity.

Calibration has been removed from the current proposed configuration.
Initial similarity labels are intended to use raw cosine similarity
thresholds:

- Strong: `>= 0.80`
- Partial: `>= 0.60` and `< 0.80`
- Weak: `> 0` and `< 0.60`
- None: no usable supporting evidence

These thresholds are heuristics and must be validated against real
examples. A similarity value should not be presented as a probability
that the candidate can perform the responsibility.

---

## Project structure

The exact directory layout can change during development. The main areas
are expected to include:

```text
TalentIQ/
├── app/                    # Next.js routes and pages
├── components/             # Reusable UI components
├── lib/
│   ├── ai/                 # AI and extraction-related logic
│   ├── ranking/             # Matching and ranking engine
│   ├── prisma/              # Prisma client, if separated
│   └── ...                  # Shared utilities
├── inngest/                 # Background job functions
├── prisma/
│   └── schema.prisma        # Database schema
├── python-service/          # FastAPI PDF extraction service
├── public/                  # Static assets
├── package.json
└── README.md
```

This is an illustrative layout. Use the actual repository structure when
navigating the codebase.

---

## Local development

The following is a general setup outline. Exact scripts and required
environment variables depend on the current repository configuration.

### Prerequisites

Install or prepare:

- Node.js version supported by the project's Next.js version
- npm (or the package manager used by the repository)
- Python
- PostgreSQL database
- Clerk application
- Supabase project and Storage bucket
- Inngest development environment/account
- Gemini API key

### 1. Clone the repository

```bash
git clone <repository-url>
cd TalentIQ
```

### 2. Install JavaScript dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using the variables required by the
application. See [Environment variables](#environment-variables).

Never commit real API keys, secrets, or production credentials.

### 4. Set up the database

After configuring the database connection, run the Prisma commands used
by the project:

```bash
npx prisma generate
npx prisma migrate dev
```

If migrations have already been applied to the database, use the
appropriate workflow rather than creating duplicate migrations.

### 5. Set up the Python extraction service

From the Python service directory, create and activate a virtual
environment, install the dependencies, and start the FastAPI
application.

Example:

```bash
cd python-service
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the service using the entry point configured in the repository.
For example, if the FastAPI instance is named `app` in `main.py`:

```bash
uvicorn main:app --reload
```

The actual module and command should be checked in the service.

### 6. Start the Next.js application

From the project root:

```bash
npm run dev
```

### 7. Run background jobs

Start the Inngest development server using the command and configuration
used by the project. Ensure the Next.js application and the Inngest
development server can reach each other.

---

## Environment variables

The exact variable names must be checked in the source code and
deployment settings. Typical configuration categories include:

Category Purpose

---

Database PostgreSQL connection string
Clerk Publishable key and secret key
Supabase Project URL and server-side key
Gemini API key
Inngest Event signing and/or event key, depending on environment
PDF service Base URL for the FastAPI extraction service

Do not put real values in this README. Add only variable names and safe
descriptions after confirming the exact names used by the code.

A local `.env.example` file is recommended. It should contain
placeholders, not working secrets.

---

## Background processing

Resume processing should be resilient to failures.

The current design uses Inngest to run resume-processing functions with
retries and a concurrency limit. This helps prevent a large batch of
uploaded resumes from overwhelming the application or extraction
service.

A typical resume state flow is:

```text
PENDING
   |
   v
PROCESSING
   |
   +------> COMPLETED
   |
   +------> FAILED
```

A failed resume should retain an error message that helps the recruiter
or developer understand what happened. Retrying a job should not
accidentally create duplicate candidate records.

---

## Important design decisions

The following decisions guide the current implementation:

1.  **Recruiter ownership:** Candidates belong to the recruiter who
    uploaded them, and jobs belong to the recruiter who created them.
2.  **Asynchronous resume processing:** PDFs are processed in background
    jobs rather than all being parsed in a single upload request.
3.  **Separate file and profile records:** A resume is the uploaded
    document; a candidate is the structured profile extracted from it.
4.  **Structured extraction:** AI-generated data is validated before it
    is persisted.
5.  **No hard eligibility gate:** Candidates are ranked rather than
    automatically excluded for missing a requirement.
6.  **Score upward from zero:** Matching criteria add to the score.
7.  **Latest evaluation per pair:** The current design stores the latest
    result for each job-candidate pair.
8.  **Explainability:** Criterion-level results and supporting evidence
    are stored so recruiters can understand the overall score.
9.  **Applicable dimensions only:** A job that does not specify a
    dimension should not penalize candidates for it.
10. **Human review:** Similarity and AI extraction results assist
    recruiters; they do not replace recruiter judgment.

---

## Current development status

Based on the current project design:

---

Area Status

---

Recruiter authentication In place / integrated with Clerk

Database and Prisma models Under active development

Resume upload and Supabase Storage Implemented in the current workflow

Background resume processing Implemented using Inngest

PDF text extraction Implemented through a
FastAPI/PyMuPDF service

Resume information extraction Under development and refinement

Job description extraction Under development and refinement

Candidate matching and ranking Design and implementation in
progress

Explainable criterion-level results Schema and behavior being designed

Score validation and calibration Requires testing with real examples

---

Update this table as features are completed. The repository's current
code is the final source of truth for implementation status.

---

## Future improvements

Potential improvements include:

- Better resume parsing for varied PDF layouts and scanned documents
- More robust skill normalization and alias handling
- Improved degree and field-of-study normalization
- Embedding-based retrieval for responsibility evidence
- Evaluation tests using realistic job descriptions and resumes
- Monitoring extraction failures and background job retries
- Recruiter feedback to assess whether rankings are useful
- Versioning the ranking algorithm so results can be compared after
  scoring changes
- Performance improvements for recruiters with large candidate
  collections
- Better handling of duplicate resumes and duplicate candidate
  profiles

---

## Contributing

Before changing the matching engine, keep the following in mind:

- Preserve the distinction between source data and evaluation-result
  data.
- Keep scoring logic separate from database access where practical.
- Make scoring functions deterministic and testable.
- Add tests for edge cases such as missing requirements, empty skill
  groups, incomplete dates, and candidates with no supporting
  evidence.
- Do not silently treat missing information as a confirmed mismatch.
- Keep recruiter-facing explanations consistent with the score
  calculation.
- Never commit `.env` files, credentials, uploaded resumes, or private
  candidate data.

---

## Disclaimer

TalentIQ is a recruiter decision-support tool. Extracted information,
semantic similarity, and ranking scores can be imperfect. Recruiters
should verify important information against the original resume and use
their judgment when making hiring decisions.
