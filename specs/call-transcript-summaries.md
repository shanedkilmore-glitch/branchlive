# Call Transcript Bullet Summaries Specification

This document summarizes the changes made to add bullet-point summaries above raw transcripts in the lead detail and call log pages.

## Overview
A new helper function, `renderTranscriptSummaryHtml`, has been added to extract 3–5 key points from call transcripts and display them above the raw transcript. Each bullet point is styled with a custom amber bullet (`var(--accent-amber)`). The raw transcript remains visible below the summary.

## Implementation Details

### 1. Extraction Logic
The `renderTranscriptSummaryHtml(transcript, existingSummary, isLogPage)` function operates as follows:
- **First Attempt (Using Existing Summary):** If a valid, non-placeholder summary is available (i.e., not empty, `'AI call completed'`, or a generic text like `'Call from...'`), it splits the text by newlines. If it extracts between 3 and 5 items, it uses them. Otherwise, it splits the summary by sentences to extract 3–5 items.
- **Second Attempt (Transcript Parsing Fallback):** If no valid summary is available, the transcript text is split into lines and cleaned of speaker tags (e.g., `Emma:`, `User:`). It then extracts sentences matching key information, including:
  - **Times/Dates:** e.g., times (am/pm/o'clock), days of the week, months.
  - **Prices:** e.g., dollar amounts, prices, fees, quotes, charges.
  - **Services:** e.g., plumbing, HVAC, AC, leak, repair, drain.
  - **Names:** e.g., "my name is", "this is".
- **Refinement:** It ensures there are between 3 and 5 points. If fewer than 3 key sentences are matched, it fills the list using other sentences from the transcript. Points are capped at 200 characters to keep summaries concise.

### 2. Styling & Layout
- **Amber Bullets:** Bullet points use `list-style: none` with an absolute-positioned amber bullet span: `<span style="position:absolute;left:0;color:var(--accent-amber);font-weight:bold">&bull;</span>`.
- **Lead Detail Page integration (`handleLeadDetailHtmx`):** The bullet summary is rendered inside the existing transcript card using a bottom margin of `16px` to separate it from the raw transcript. It looks for the most recent call's summary as its first choice.
- **Call Logs Page integration (`handleCallsHtmx`):** The bullet summary is rendered inside the expanded call drawer. It uses padding of `12px 16px` and a bottom border to match the header information blocks (`.call-lead`).

---

## Code Modification Summary

- **File Modified:** [worker.js](file:///C:/Users/17173/Projects/branchlive/worker.js)
- **Functions Added/Modified:**
  - Added `renderTranscriptSummaryHtml` utility function.
  - Updated `handleLeadDetailHtmx` to include the bullet summary card element above the raw transcript.
  - Updated `handleCallsHtmx` to render the bullet summary inside the call row expansion row before the raw transcript.
