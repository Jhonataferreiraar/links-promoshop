import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(
    fileURLToPath(import.meta.url)
  ),
  '..'
);

const secretsPath =
  path.join(
    root,
    'data',
    'secrets.enc'
  );

function getEncryptionKey() {
  const secret =
    String(
      process.env.APP_SECRET ||
      ''
    );

  if (
    secret.length < 32
  ) {
    throw new Error(
      'APP_SECRET precisa ter pelo menos 32 caracteres.'
    );
  }

  return crypto
    .createHash('sha256')
    .update(secret)
    .digest();
}

function encryptObject(
  object
) {
  const key =
    getEncryptionKey();

  const iv =
    crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      'aes-256-gcm',
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        JSON.stringify(
          object
        ),
        'utf8'
      ),

      cipher.final()
    ]);

  const authTag =
    cipher.getAuthTag();

  return JSON.stringify({
    version: 1,

    iv:
      iv.toString(
        'base64'
      ),

    tag:
      authTag.toString(
        'base64'
      ),

    data:
      encrypted.toString(
        'base64'
      )
  });
}

function decryptObject(
  encryptedText
) {
  const payload =
    JSON.parse(
      encryptedText
    );

  const key =
    getEncryptionKey();

  const iv =
    Buffer.from(
      payload.iv,
      'base64'
    );

  const tag =
    Buffer.from(
      payload.tag,
      'base64'
    );

  const data =
    Buffer.from(
      payload.data,
      'base64'
    );

  const decipher =
    crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      iv
    );

  decipher.setAuthTag(
    tag
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        data
      ),

      decipher.final()
    ]);

  return JSON.parse(
    decrypted.toString(
      'utf8'
    )
  );
}

export function hashPassword(
  password
) {
  const salt =
    crypto.randomBytes(16);

  const hash =
    crypto.scryptSync(
      password,
      salt,
      64
    );

  return {
    salt:
      salt.toString(
        'hex'
      ),

    hash:
      hash.toString(
        'hex'
      )
  };
}

export function verifyPassword(
  password,
  passwordData
) {
  if (
    !passwordData?.salt ||
    !passwordData?.hash
  ) {
    return false;
  }

  try {
    const hash =
      crypto.scryptSync(
        password,
        Buffer.from(
          passwordData.salt,
          'hex'
        ),
        64
      );

    const expected =
      Buffer.from(
        passwordData.hash,
        'hex'
      );

    if (
      hash.length !==
      expected.length
    ) {
      return false;
    }

    return crypto
      .timingSafeEqual(
        hash,
        expected
      );
  } catch {
    return false;
  }
}

async function createInitialSecrets() {
  const adminUser =
    String(
      process.env.ADMIN_USER ||
      'admin'
    ).trim();

  const adminPassword =
    String(
      process.env.ADMIN_PASSWORD ||
      ''
    );

  if (
    adminPassword.length <
    12
  ) {
    throw new Error(
      'ADMIN_PASSWORD precisa ter pelo menos 12 caracteres.'
    );
  }

  const initial = {
    adminUser,

    adminPassword:
      hashPassword(
        adminPassword
      ),

    adminSessionVersion: 1,

    createdAt:
      new Date()
        .toISOString()
  };

  await fs.mkdir(
    path.dirname(
      secretsPath
    ),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    secretsPath,
    encryptObject(
      initial
    ),
    {
      encoding: 'utf8',
      mode: 0o600
    }
  );

  return initial;
}

export async function readSecrets() {
  try {
    const encrypted =
      await fs.readFile(
        secretsPath,
        'utf8'
      );

    return decryptObject(
      encrypted
    );
  } catch (
    error
  ) {
    if (
      error.code ===
      'ENOENT'
    ) {
      return createInitialSecrets();
    }

    throw error;
  }
}

async function writeSecrets(
  secrets
) {
  await fs.mkdir(
    path.dirname(
      secretsPath
    ),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    secretsPath,
    encryptObject(
      secrets
    ),
    {
      encoding:
        'utf8',

      mode:
        0o600
    }
  );

  return secrets;
}

export async function updateAdminCredentials({
  adminUser,
  adminPassword
}) {
  const current =
    await readSecrets();

  if (
    adminUser
  ) {
    current.adminUser =
      String(
        adminUser
      )
        .trim()
        .slice(
          0,
          80
        );
  }

  if (
    adminPassword
  ) {
    if (
      String(
        adminPassword
      ).length < 12
    ) {
      throw new Error(
        'A senha deve possuir pelo menos 12 caracteres.'
      );
    }

    current.adminPassword =
      hashPassword(
        String(
          adminPassword
        )
      );

    current.adminSessionVersion =
      Number(
        current
          .adminSessionVersion ||
        1
      ) + 1;
  }

  current.updatedAt =
    new Date()
      .toISOString();

  return writeSecrets(
    current
  );
}

export function secretStatus(
  secrets
) {
  return {
    adminUser:
      secrets.adminUser ||
      'admin',

    passwordConfigured:
      Boolean(
        secrets
          .adminPassword
          ?.hash
      )
  };
}