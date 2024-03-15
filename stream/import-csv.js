import { parse } from "csv-parse"
import fs from "node:fs"
import fetch from 'node-fetch';

const csvPath = new URL('./tasks.csv', import.meta.url)

const stream = fs.createReadStream(csvPath)

const csvParsed = parse({
  delimiter: ',',
  skipEmptyLines: true,
  fromLine: 2
})

export async function readCsvAndSendRequests() {
  const linesParsed = stream.pipe(csvParsed);

  for await (const record of linesParsed) {

    const [title, description] = record;

    await fetch('http://localhost:3335/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
      }),
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Todas as requisições POST foram enviadas.');
}

readCsvAndSendRequests().catch(error => {
  console.error('Ocorreu um erro:', error);
});