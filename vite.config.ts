import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const waiverFilePath = path.resolve(__dirname, 'data', 'waiver-records.json');
  const socialDraftFilePath = path.resolve(__dirname, 'data', 'social-drafts.json');

  const readJsonFile = async (filePath: string) => JSON.parse(await fs.readFile(filePath, 'utf-8'));
  const writeJsonFile = async (filePath: string, value: unknown) => fs.writeFile(filePath, JSON.stringify(value, null, 2));
  const readRequestBody = async (req: any) => {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    return body ? JSON.parse(body) : {};
  };

  const waiverApiPlugin = {
    name: 'waiver-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        if (req.method === 'GET' && req.url === '/api/waivers') {
          const records = await readJsonFile(waiverFilePath);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ records }));
          return;
        }

        if (req.method === 'POST' && req.url === '/api/waivers/sign') {
          const payload = await readRequestBody(req);
          const existingRecords = await readJsonFile(waiverFilePath);
          const nextRecords = existingRecords.map((record: any) => (
            record.appointmentId === payload.appointmentId && payload.templateIds.includes(record.templateId)
              ? {
                  ...record,
                  status: 'signed',
                  signedAt: new Date().toISOString(),
                  signerName: payload.signerName,
                  signature: payload.signature,
                  signedText: payload.signedText,
                }
              : record
          ));

          await writeJsonFile(waiverFilePath, nextRecords);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ records: nextRecords }));
          return;
        }

        if (req.method === 'GET' && req.url === '/api/social-drafts') {
          const drafts = await readJsonFile(socialDraftFilePath);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ drafts }));
          return;
        }

        if (req.method === 'POST' && req.url === '/api/social-drafts') {
          const payload = await readRequestBody(req);
          const existingDrafts = await readJsonFile(socialDraftFilePath);
          const nextDrafts = [payload, ...existingDrafts];
          await writeJsonFile(socialDraftFilePath, nextDrafts);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ drafts: nextDrafts }));
          return;
        }

        if (req.method === 'PATCH' && req.url.startsWith('/api/social-drafts/')) {
          const draftId = req.url.split('/').pop();
          const payload = await readRequestBody(req);
          const existingDrafts = await readJsonFile(socialDraftFilePath);
          const nextDrafts = existingDrafts.map((draft: any) => (
            draft.id === draftId ? { ...draft, status: payload.status } : draft
          ));
          await writeJsonFile(socialDraftFilePath, nextDrafts);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ drafts: nextDrafts }));
          return;
        }

        next();
      });
    },
  };

  return {
    plugins: [react(), tailwindcss(), waiverApiPlugin],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
