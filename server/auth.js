import jwt from 'jsonwebtoken';
import { readSecrets } from './secrets.js';

function jwtSecret() {
  const secret =
    String(
      process.env.JWT_SECRET ||
      ''
    );

  if (
    secret.length < 32
  ) {
    throw new Error(
      'JWT_SECRET precisa ter pelo menos 32 caracteres.'
    );
  }

  return secret;
}

export function createToken(
  username,
  sessionVersion
) {
  return jwt.sign(
    {
      sub:
        username,

      sessionVersion:
        Number(
          sessionVersion ||
          1
        )
    },

    jwtSecret(),

    {
      algorithm:
        'HS256',

      expiresIn:
        '8h',

      issuer:
        'links-promoshop'
    }
  );
}

export async function requireAdmin(
  req,
  res,
  next
) {
  const authorization =
    String(
      req.headers
        .authorization ||
      ''
    );

  if (
    !authorization.startsWith(
      'Bearer '
    )
  ) {
    return res
      .status(401)
      .json({
        error:
          'Sessão não autorizada.'
      });
  }

  const token =
    authorization.slice(7);

  try {
    const payload =
      jwt.verify(
        token,
        jwtSecret(),
        {
          algorithms: [
            'HS256'
          ],

          issuer:
            'links-promoshop'
        }
      );

    const secrets =
      await readSecrets();

    if (
      payload.sub !==
      secrets.adminUser ||
      Number(
        payload.sessionVersion
      ) !==
      Number(
        secrets
          .adminSessionVersion ||
        1
      )
    ) {
      return res
        .status(401)
        .json({
          error:
            'Sessão expirada.'
        });
    }

    req.admin = {
      username:
        payload.sub
    };

    next();
  } catch {
    return res
      .status(401)
      .json({
        error:
          'Sessão inválida ou expirada.'
      });
  }
}