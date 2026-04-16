/**
 * Scratch script to test script generation and see exact provider errors.
 * Run with: npx ts-node -r dotenv/config --project tsconfig.json tmp/test-script.ts
 */

import { generateScript } from '../lib/script-generator';

const MOCK_RESUME = `
Rajesh Uriti
Full Stack Developer
Skills: React, Node.js, TypeScript, AWS.
Experience: 5 years at Tech Solutions. Built several cloud-native apps.
`;

async function test() {
  console.log('--- Starting Script Generation Test ---');
  try {
    const script = await generateScript(MOCK_RESUME, true);
    console.log('SUCCESS!');
    console.log(JSON.stringify(script, null, 2));
  } catch (err: any) {
    console.error('FAILED!');
    console.error(err.message);
    if (err.stack) {
      console.error('Stack Trace:');
      console.error(err.stack);
    }
  }
}

test();
