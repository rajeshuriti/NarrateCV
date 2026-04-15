/**
 * PDF text extraction.
 * pdf-parse is used directly from its dist build to avoid the test-file
 * import issue that appears when importing from the package root in some
 * Next.js configurations.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  data: Buffer,
  options?: object,
) => Promise<{ text: string; numpages: number }>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer, {
    // Limit to first 10 pages for MVP — resumes are rarely longer
    max: 10,
  });

  // Normalise whitespace from PDF extraction
  return data.text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
