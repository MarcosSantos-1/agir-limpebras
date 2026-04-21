/**
 * Importa linhas de services/pontos_viciados.xlsx para a coleção `points` do Firestore.
 *
 * Pré-requisitos:
 * - `npm install` (firebase-admin, xlsx, tsx em dev)
 * - Variável `GOOGLE_APPLICATION_CREDENTIALS` apontando para JSON de conta de serviço com permissão Firestore
 * - Ou `gcloud auth application-default login` para ADC
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/sa.json npx tsx scripts/import-pontos.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/sa.json npx tsx scripts/import-pontos.ts --file ./services/pontos_viciados.xlsx
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as XLSX from "xlsx";

const DEFAULT_FILE = resolve("services/pontos_viciados.xlsx");

function argFile(): string {
  const i = process.argv.indexOf("--file");
  if (i >= 0 && process.argv[i + 1]) return resolve(process.argv[i + 1]!);
  return DEFAULT_FILE;
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const found = rowKeys.find((rk) => rk.toLowerCase() === k.toLowerCase()) ?? k;
    const v = row[found];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(",", "."));
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function pickStr(row: Record<string, unknown>, keys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const found = rowKeys.find((rk) => rk.toLowerCase() === k.toLowerCase()) ?? k;
    const v = row[found];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}

async function main() {
  const file = argFile();
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !json) {
    console.error(
      "Defina GOOGLE_APPLICATION_CREDENTIALS (caminho do JSON) ou GOOGLE_APPLICATION_CREDENTIALS_JSON."
    );
    process.exit(1);
  }

  if (!getApps().length) {
    if (json) {
      const parsed = JSON.parse(json) as {
        project_id: string;
        client_email: string;
        private_key: string;
      };
      initializeApp({
        credential: cert({
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }

  const db = getFirestore();
  const buf = readFileSync(file);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    console.error("Planilha vazia.");
    process.exit(1);
  }
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  let batch = db.batch();
  let count = 0;
  let ops = 0;
  const BATCH = 400;

  for (const row of rows) {
    const lat = pickNumber(row, ["lat", "latitude", "y", "coordenada y"]);
    const lng = pickNumber(row, ["lng", "lon", "longitude", "x", "coordenada x"]);
    const address = pickStr(row, [
      "endereco",
      "endereço",
      "logradouro",
      "address",
      "local",
    ]);
    if (lat == null || lng == null || !address) {
      continue;
    }

    const ref = db.collection("points").doc();
    batch.set(ref, {
      address,
      geo: { lat, lng },
      type: "viciado",
      status: "ativo",
      assigneeUserId: null,
      lastActionAt: null,
      notes: pickStr(row, ["observacoes", "observações", "notas"]),
      recurrenceFlag: Boolean(pickStr(row, ["reincidencia", "reincidência"])),
      subprefeitura: pickStr(row, ["subprefeitura", "sub"]) || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count += 1;
    ops += 1;

    if (ops >= BATCH) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.error(`… ${count} documentos preparados`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Importação concluída: ${count} pontos (de ${rows.length} linhas lidas).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
