import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(
    fileURLToPath(import.meta.url)
  ),
  '..'
);

const dataDir = path.join(
  root,
  'data'
);

const storePath = path.join(
  dataDir,
  'store.json'
);

const defaultStore = {
  config: {
    brandName: 'PromoShop',

    pageTitle:
      'Links PromoShop',

    headline:
      'Promoções boas estão a um clique.',

    description:
      'Acesse o site oficial da PromoShop e escolha os grupos de ofertas que mais combinam com você.',

    logoUrl:
      "",

    faviconUrl:
      '/favicon.svg',

    primaryColor:
      '#1269f3',

    secondaryColor:
      '#6c5ce7',

    backgroundColor:
      '#07111f',

    backgroundStyle:
      'gradient',

    buttonStyle:
      'rounded',

    showLogo: true,
    showFooter: true,

    footerText:
      'PromoShop • Encontre ofertas sem perder tempo.',

    disclosure:
      'Podemos receber comissão pelas compras realizadas através de alguns links, sem custo adicional para você.'
  },

  links: [],

  meta: {
    updatedAt: null
  }
};

let writeQueue =
  Promise.resolve();

export function createId(
  prefix = 'item'
) {
  return `${prefix}_${Date.now()}_${crypto
    .randomBytes(4)
    .toString('hex')}`;
}

async function ensureStore() {
  await fs.mkdir(
    dataDir,
    {
      recursive: true
    }
  );

  try {
    await fs.access(
      storePath
    );
  } catch {
    await fs.writeFile(
      storePath,
      JSON.stringify(
        defaultStore,
        null,
        2
      ),
      'utf8'
    );
  }
}

export async function readStore() {
  await ensureStore();

  try {
    const raw =
      await fs.readFile(
        storePath,
        'utf8'
      );

    const parsed =
      JSON.parse(raw);

    return {
      ...defaultStore,
      ...parsed,

      config: {
        ...defaultStore.config,
        ...(parsed.config || {})
      },

      links:
        Array.isArray(
          parsed.links
        )
          ? parsed.links
          : [],

      meta: {
        ...defaultStore.meta,
        ...(parsed.meta || {})
      }
    };
  } catch (error) {
    console.error(
      'Erro ao ler store.json:',
      error
    );

    return structuredClone(
      defaultStore
    );
  }
}

export async function updateStore(
  updater
) {
  writeQueue =
    writeQueue.then(
      async () => {
        const current =
          await readStore();

        await updater(
          current
        );

        current.meta =
          current.meta || {};

        current.meta.updatedAt =
          new Date()
            .toISOString();

        const temporaryPath =
          `${storePath}.tmp`;

        await fs.writeFile(
          temporaryPath,
          JSON.stringify(
            current,
            null,
            2
          ),
          'utf8'
        );

        await fs.rename(
          temporaryPath,
          storePath
        );

        return current;
      }
    );

  return writeQueue;
}