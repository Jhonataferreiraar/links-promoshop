import 'dotenv/config';

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';
import multer from 'multer';

import {
    createId,
    readStore,
    updateStore
} from './store.js';

import {
    createToken,
    requireAdmin
} from './auth.js';

import {
    readSecrets,
    secretStatus,
    updateAdminCredentials,
    verifyPassword
} from './secrets.js';

const app =
    express();

app.disable(
    'x-powered-by'
);

const port =
    Number(
        process.env.PORT ||
        3001
    );

const root =
    path.resolve(
        path.dirname(
            fileURLToPath(
                import.meta.url
            )
        ),
        '..'
    );

const uploadsDirectory =
    path.join(
        root,
        'data',
        'uploads'
    );

await fs.mkdir(
    uploadsDirectory,
    {
        recursive: true
    }
);

app.set(
    'trust proxy',
    1
);

/*
 * ======================================================
 * CORS
 * ======================================================
 */

const allowedOrigins =
    String(
        process.env.SITE_URL ||
        ''
    )
        .split(',')
        .map(
            (value) =>
                value
                    .trim()
                    .replace(
                        /\/$/,
                        ''
                    )
        )
        .filter(Boolean);

app.use(
    cors({
        origin(
            origin,
            callback
        ) {
            if (
                !origin ||
                allowedOrigins.includes(
                    origin.replace(
                        /\/$/,
                        ''
                    )
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            return callback(
                null,
                false
            );
        },

        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE'
        ]
    })
);

/*
 * ======================================================
 * HEADERS DE SEGURANÇA
 * ======================================================
 */

app.use(
    (
        req,
        res,
        next
    ) => {
        res.setHeader(
            'X-Content-Type-Options',
            'nosniff'
        );

        res.setHeader(
            'X-Frame-Options',
            'DENY'
        );

        res.setHeader(
            'Referrer-Policy',
            'strict-origin-when-cross-origin'
        );

        res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=()'
        );

        res.setHeader(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "base-uri 'self'",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "form-action 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "connect-src 'self'",
                "font-src 'self' data:"
            ].join('; ')
        );

        if (
            req.secure ||
            req.headers[
            'x-forwarded-proto'
            ] === 'https'
        ) {
            res.setHeader(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        if (
            req.path.startsWith(
                '/api/admin'
            ) ||
            req.path.startsWith(
                '/api/auth'
            )
        ) {
            res.setHeader(
                'Cache-Control',
                'no-store'
            );
        }

        next();
    }
);

app.use(
    express.json({
        limit: '500kb'
    })
);

/*
 * ======================================================
 * LOGIN RATE LIMIT
 * ======================================================
 */

const loginAttempts =
    new Map();

const loginWindowMs =
    15 * 60 * 1000;

const maximumLoginAttempts =
    5;

function loginState(
    ip
) {
    const now =
        Date.now();

    const state =
        loginAttempts.get(
            ip
        );

    if (
        !state ||
        state.resetAt <= now
    ) {
        const fresh = {
            attempts: 0,

            resetAt:
                now +
                loginWindowMs,

            blockedUntil:
                0
        };

        loginAttempts.set(
            ip,
            fresh
        );

        return fresh;
    }

    return state;
}

/*
 * ======================================================
 * VALIDAÇÕES
 * ======================================================
 */

function cleanText(
    value,
    max = 300
) {
    return String(
        value || ''
    )
        .trim()
        .slice(
            0,
            max
        );
}

function validUrl(
    value
) {
    try {
        const parsed =
            new URL(
                String(
                    value
                )
            );

        return [
            'https:',
            'http:'
        ].includes(
            parsed.protocol
        );
    } catch {
        return false;
    }
}

function isPrivateHostname(hostname) {
    const host =
        String(hostname || '')
            .toLowerCase()
            .trim();

    if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.endsWith('.local')
    ) {
        return true;
    }

    if (
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^169\.254\./.test(host)
    ) {
        return true;
    }

    const match =
        host.match(
            /^172\.(\d+)\./
        );

    if (match) {
        const second =
            Number(match[1]);

        if (
            second >= 16 &&
            second <= 31
        ) {
            return true;
        }
    }

    return false;
}

function resolveUrl(
    value,
    base
) {
    try {
        return new URL(
            value,
            base
        ).href;
    } catch {
        return '';
    }
}

function extractFaviconFromHtml(
    html,
    pageUrl
) {
    const linkRegex =
        /<link\b[^>]*>/gi;

    const links =
        html.match(
            linkRegex
        ) || [];

    const priorities = [
        'apple-touch-icon',
        'icon',
        'shortcut icon'
    ];

    for (
        const priority
        of priorities
    ) {
        for (
            const tag
            of links
        ) {
            const relMatch =
                tag.match(
                    /\brel\s*=\s*["']([^"']+)["']/i
                );

            const hrefMatch =
                tag.match(
                    /\bhref\s*=\s*["']([^"']+)["']/i
                );

            if (
                !relMatch ||
                !hrefMatch
            ) {
                continue;
            }

            const rel =
                relMatch[1]
                    .toLowerCase();

            if (
                priority === 'icon'
                    ? (
                        !rel
                            .split(/\s+/)
                            .includes(
                                'icon'
                            ) ||
                        rel.includes(
                            'apple-touch-icon'
                        )
                    )
                    : !rel.includes(
                        priority
                    )
            ) {
                continue;
            }

            const resolved =
                resolveUrl(
                    hrefMatch[1],
                    pageUrl
                );

            if (resolved) {
                return resolved;
            }
        }
    }

    return '';
}

function cleanColor(
    value,
    fallback
) {
    const color =
        String(
            value || ''
        ).trim();

    return /^#[0-9a-f]{6}$/i.test(
        color
    )
        ? color
        : fallback;
}

/*
 * ======================================================
 * UPLOAD DA LOGO
 * ======================================================
 */

const allowedLogoMimeTypes =
    new Set([
        'image/png',
        'image/jpeg',
        'image/webp'
    ]);

const logoStorage =
    multer.diskStorage({
        destination(
            _req,
            _file,
            callback
        ) {
            callback(
                null,
                uploadsDirectory
            );
        },

        filename(
            _req,
            file,
            callback
        ) {
            const extensionMap = {
                'image/png':
                    '.png',

                'image/jpeg':
                    '.jpg',

                'image/webp':
                    '.webp'
            };

            const extension =
                extensionMap[
                file.mimetype
                ];

            const filename =
                `logo-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 10)}${extension}`;

            callback(
                null,
                filename
            );
        }
    });

const uploadLogo =
    multer({
        storage:
            logoStorage,

        limits: {
            fileSize:
                2 * 1024 * 1024
        },

        fileFilter(
            _req,
            file,
            callback
        ) {
            if (
                !allowedLogoMimeTypes.has(
                    file.mimetype
                )
            ) {
                return callback(
                    new Error(
                        'Formato de imagem não permitido. Use PNG, JPG ou WEBP.'
                    )
                );
            }

            callback(
                null,
                true
            );
        }
    });

/*
 * ======================================================
 * HEALTH
 * ======================================================
 */

app.get(
    '/api/health',
    (
        _req,
        res
    ) => {
        res.json({
            ok: true,

            service:
                'links-promoshop',

            time:
                new Date()
                    .toISOString()
        });
    }
);

/*
 * ======================================================
 * PÚBLICO
 * ======================================================
 */

app.get(
    '/api/favicon',
    async (
        req,
        res
    ) => {
        try {
            const rawUrl =
                cleanText(
                    req.query?.url,
                    1000
                );

            if (
                !rawUrl ||
                !validUrl(rawUrl)
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'URL inválida.'
                    });
            }

            const parsed =
                new URL(rawUrl);

            if (
                isPrivateHostname(
                    parsed.hostname
                )
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Endereço não permitido.'
                    });
            }

            const controller =
                new AbortController();

            const timeout =
                setTimeout(
                    () =>
                        controller.abort(),
                    5000
                );

            let response;

            try {
                response =
                    await fetch(
                        parsed.href,
                        {
                            headers: {
                                'User-Agent':
                                    'Mozilla/5.0 LinksPromoShop/1.0',

                                Accept:
                                    'text/html,application/xhtml+xml'
                            },

                            redirect:
                                'follow',

                            signal:
                                controller.signal
                        }
                    );
            } finally {
                clearTimeout(
                    timeout
                );
            }

            if (
                !response.ok
            ) {
                throw new Error(
                    'Página não respondeu.'
                );
            }

            const contentType =
                response.headers.get(
                    'content-type'
                ) || '';

            if (
                !contentType.includes(
                    'text/html'
                )
            ) {
                throw new Error(
                    'Conteúdo inválido.'
                );
            }

            const html =
                (
                    await response.text()
                ).slice(
                    0,
                    500000
                );

            let faviconUrl =
                extractFaviconFromHtml(
                    html,
                    response.url ||
                    parsed.href
                );

            if (!faviconUrl) {
                faviconUrl =
                    `${parsed.origin}/favicon.ico`;
            }

            res.setHeader(
                'Cache-Control',
                'public, max-age=3600'
            );

            return res.json({
                faviconUrl
            });
        } catch (
            error
        ) {
            console.error(
                '[FAVICON]',
                error.message
            );

            return res.json({
                faviconUrl: ''
            });
        }
    }
);

app.get(
    '/api/public',
    async (
        _req,
        res
    ) => {
        const data =
            await readStore();

        const links =
            data.links
                .filter(
                    (link) =>
                        link.enabled !==
                        false &&
                        link.url
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.order ||
                            0
                        ) -
                        Number(
                            b.order ||
                            0
                        )
                );

        res.json({
            config:
                data.config,

            links
        });
    }
);

/*
 * ======================================================
 * LOGIN
 * ======================================================
 */

app.post(
    '/api/auth/login',
    async (
        req,
        res
    ) => {
        const ip =
            req.ip ||
            req.socket
                .remoteAddress ||
            'unknown';

        const state =
            loginState(
                ip
            );

        if (
            state.blockedUntil >
            Date.now()
        ) {
            const seconds =
                Math.ceil(
                    (
                        state.blockedUntil -
                        Date.now()
                    ) / 1000
                );

            res.setHeader(
                'Retry-After',
                String(
                    seconds
                )
            );

            return res
                .status(429)
                .json({
                    error:
                        'Muitas tentativas de acesso. Aguarde alguns minutos.'
                });
        }

        const username =
            cleanText(
                req.body
                    ?.username,
                80
            );

        const password =
            String(
                req.body
                    ?.password ||
                ''
            );

        const secrets =
            await readSecrets();

        const userOk =
            username ===
            secrets.adminUser;

        const passwordOk =
            verifyPassword(
                password,
                secrets.adminPassword
            );

        if (
            !userOk ||
            !passwordOk
        ) {
            state.attempts +=
                1;

            if (
                state.attempts >=
                maximumLoginAttempts
            ) {
                state.blockedUntil =
                    Date.now() +
                    loginWindowMs;
            }

            loginAttempts.set(
                ip,
                state
            );

            return res
                .status(401)
                .json({
                    error:
                        'Usuário ou senha incorretos.'
                });
        }

        loginAttempts.delete(
            ip
        );

        res.json({
            token:
                createToken(
                    secrets.adminUser,
                    secrets
                        .adminSessionVersion
                )
        });
    }
);

/*
 * ======================================================
 * DASHBOARD
 * ======================================================
 */

app.get(
    '/api/admin/dashboard',
    requireAdmin,
    async (
        _req,
        res
    ) => {
        const data =
            await readStore();

        const secrets =
            await readSecrets();

        res.json({
            ...data,

            secrets:
                secretStatus(
                    secrets
                )
        });
    }
);

/*
 * ======================================================
 * CONFIGURAÇÕES
 * ======================================================
 */

app.put(
    '/api/admin/config',
    requireAdmin,
    async (
        req,
        res
    ) => {
        await updateStore(
            (data) => {
                const incoming =
                    req.body || {};

                data.config = {
                    ...data.config,

                    brandName:
                        cleanText(
                            incoming.brandName ??
                            data.config
                                .brandName,
                            80
                        ),

                    pageTitle:
                        cleanText(
                            incoming.pageTitle ??
                            data.config
                                .pageTitle,
                            120
                        ),

                    headline:
                        cleanText(
                            incoming.headline ??
                            data.config
                                .headline,
                            180
                        ),

                    description:
                        cleanText(
                            incoming.description ??
                            data.config
                                .description,
                            500
                        ),

                    logoUrl:
                        cleanText(
                            incoming.logoUrl ??
                            data.config
                                .logoUrl,
                            300
                        ),

                    primaryColor:
                        cleanColor(
                            incoming
                                .primaryColor ??
                            data.config
                                .primaryColor,
                            '#1269f3'
                        ),

                    secondaryColor:
                        cleanColor(
                            incoming
                                .secondaryColor ??
                            data.config
                                .secondaryColor,
                            '#6c5ce7'
                        ),

                    backgroundColor:
                        cleanColor(
                            incoming
                                .backgroundColor ??
                            data.config
                                .backgroundColor,
                            '#07111f'
                        ),

                    backgroundStyle:
                        [
                            'gradient',
                            'solid'
                        ].includes(
                            incoming
                                .backgroundStyle
                        )
                            ? incoming
                                .backgroundStyle
                            : data.config
                                .backgroundStyle,

                    buttonStyle:
                        [
                            'rounded',
                            'pill',
                            'square'
                        ].includes(
                            incoming
                                .buttonStyle
                        )
                            ? incoming
                                .buttonStyle
                            : data.config
                                .buttonStyle,

                    showLogo:
                        incoming.showLogo !==
                            undefined
                            ? Boolean(
                                incoming
                                    .showLogo
                            )
                            : data.config
                                .showLogo,

                    showFooter:
                        incoming.showFooter !==
                            undefined
                            ? Boolean(
                                incoming
                                    .showFooter
                            )
                            : data.config
                                .showFooter,

                    footerText:
                        cleanText(
                            incoming.footerText ??
                            data.config
                                .footerText,
                            300
                        ),

                    disclosure:
                        cleanText(
                            incoming.disclosure ??
                            data.config
                                .disclosure,
                            500
                        )
                };
            }
        );

        res.json({
            ok: true
        });
    }
);

/*
 * ======================================================
 * UPLOAD DA LOGO
 * ======================================================
 */

app.post(
  '/api/admin/logo',
  requireAdmin,
  uploadLogo.single(
    'logo'
  ),
  async (
    req,
    res
  ) => {
    if (
      !req.file
    ) {
      return res
        .status(400)
        .json({
          error:
            'Selecione uma imagem para a logo.'
        });
    }

    const logoUrl =
      `/uploads/${req.file.filename}`;

    let previousLogo =
      '';

    await updateStore(
      (data) => {
        previousLogo =
          String(
            data.config
              .logoUrl ||
            ''
          );

        data.config.logoUrl =
          logoUrl;
      }
    );

    /*
     * Remove a logo anterior,
     * se ela tiver sido enviada
     * pelo próprio painel.
     */
    if (
      previousLogo.startsWith(
        '/uploads/'
      )
    ) {
      const previousFilename =
        path.basename(
          previousLogo
        );

      await fs
        .unlink(
          path.join(
            uploadsDirectory,
            previousFilename
          )
        )
        .catch(
          () => {}
        );
    }

    res.json({
      ok: true,
      logoUrl
    });
  }
);


/*
 * ======================================================
 * REMOVER LOGO
 * ======================================================
 */

app.delete(
  '/api/admin/logo',
  requireAdmin,
  async (
    _req,
    res
  ) => {
    let previousLogo =
      '';

    await updateStore(
      (data) => {
        previousLogo =
          String(
            data.config
              .logoUrl ||
            ''
          );

        data.config.logoUrl =
          '';
      }
    );

    if (
      previousLogo.startsWith(
        '/uploads/'
      )
    ) {
      const previousFilename =
        path.basename(
          previousLogo
        );

      await fs
        .unlink(
          path.join(
            uploadsDirectory,
            previousFilename
          )
        )
        .catch(
          () => {}
        );
    }

    res.json({
      ok: true
    });
  }
);

/*
 * ======================================================
 * ADICIONAR LINK
 * ======================================================
 */

app.post(
    '/api/admin/links',
    requireAdmin,
    async (
        req,
        res
    ) => {
        const title =
            cleanText(
                req.body
                    ?.title,
                120
            );

        const url =
            cleanText(
                req.body
                    ?.url,
                600
            );

        if (
            !title
        ) {
            return res
                .status(400)
                .json({
                    error:
                        'Informe o título do link.'
                });
        }

        if (
            !url ||
            !validUrl(
                url
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        'Informe uma URL válida.'
                });
        }

        const link = {
            id:
                createId(
                    'link'
                ),

            title,

            subtitle:
                cleanText(
                    req.body
                        ?.subtitle,
                    220
                ),

            url,

            enabled:
                req.body
                    ?.enabled !==
                false,

            featured:
                Boolean(
                    req.body
                        ?.featured
                ),

            order:
                Number(
                    req.body
                        ?.order ||
                    999
                ),

            createdAt:
                new Date()
                    .toISOString()
        };

        await updateStore(
            (data) => {
                data.links.push(
                    link
                );
            }
        );

        res
            .status(201)
            .json(
                link
            );
    }
);

/*
 * ======================================================
 * EDITAR LINK
 * ======================================================
 */

app.put(
    '/api/admin/links/:id',
    requireAdmin,
    async (
        req,
        res
    ) => {
        let updated =
            null;

        await updateStore(
            (data) => {
                const link =
                    data.links.find(
                        (item) =>
                            item.id ===
                            req.params.id
                    );

                if (!link) {
                    return;
                }

                if (
                    'title' in
                    req.body
                ) {
                    link.title =
                        cleanText(
                            req.body
                                .title,
                            120
                        );
                }

                if (
                    'subtitle' in
                    req.body
                ) {
                    link.subtitle =
                        cleanText(
                            req.body
                                .subtitle,
                            220
                        );
                }

                if (
                    'url' in
                    req.body
                ) {
                    const url =
                        cleanText(
                            req.body.url,
                            600
                        );

                    if (
                        !validUrl(
                            url
                        )
                    ) {
                        throw new Error(
                            'URL inválida.'
                        );
                    }

                    link.url =
                        url;
                }

                if (
                    'enabled' in
                    req.body
                ) {
                    link.enabled =
                        Boolean(
                            req.body
                                .enabled
                        );
                }

                if (
                    'featured' in
                    req.body
                ) {
                    link.featured =
                        Boolean(
                            req.body
                                .featured
                        );
                }

                if (
                    'order' in
                    req.body
                ) {
                    link.order =
                        Number(
                            req.body
                                .order ||
                            0
                        );
                }

                link.updatedAt =
                    new Date()
                        .toISOString();

                updated = {
                    ...link
                };
            }
        );

        if (
            !updated
        ) {
            return res
                .status(404)
                .json({
                    error:
                        'Link não encontrado.'
                });
        }

        res.json(
            updated
        );
    }
);

/*
 * ======================================================
 * EXCLUIR LINK
 * ======================================================
 */

app.delete(
    '/api/admin/links/:id',
    requireAdmin,
    async (
        req,
        res
    ) => {
        let removed =
            false;

        await updateStore(
            (data) => {
                const previous =
                    data.links.length;

                data.links =
                    data.links.filter(
                        (link) =>
                            link.id !==
                            req.params.id
                    );

                removed =
                    data.links.length !==
                    previous;
            }
        );

        if (
            !removed
        ) {
            return res
                .status(404)
                .json({
                    error:
                        'Link não encontrado.'
                });
        }

        res.json({
            ok: true
        });
    }
);

/*
 * ======================================================
 * ALTERAR LOGIN
 * ======================================================
 */

app.put(
    '/api/admin/security',
    requireAdmin,
    async (
        req,
        res
    ) => {
        try {
            const adminUser =
                cleanText(
                    req.body
                        ?.adminUser,
                    80
                );

            const adminPassword =
                String(
                    req.body
                        ?.adminPassword ||
                    ''
                );

            if (
                !adminUser
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Informe o usuário administrador.'
                    });
            }

            await updateAdminCredentials({
                adminUser,

                adminPassword:
                    adminPassword ||
                    undefined
            });

            res.json({
                ok: true,

                requiresLogin:
                    Boolean(
                        adminPassword
                    )
            });
        } catch (
        error
        ) {
            res
                .status(400)
                .json({
                    error:
                        error.message
                });
        }
    }
);

/*
 * ======================================================
 * FRONTEND
 * ======================================================
 */

app.use(
  '/uploads',
  express.static(
    uploadsDirectory,
    {
      fallthrough: false,

      maxAge:
        '7d',

      immutable:
        false
    }
  )
);

app.use(
    express.static(
        path.join(
            root,
            'dist'
        )
    )
);

app.use(
    (
        req,
        res,
        next
    ) => {
        if (
            req.path.startsWith(
                '/api'
            )
        ) {
            return next();
        }

        res.sendFile(
            path.join(
                root,
                'dist',
                'index.html'
            )
        );
    }
);

/*
 * ======================================================
 * ERROR HANDLER
 * ======================================================
 */

app.use(
    (
        error,
        _req,
        res,
        _next
    ) => {
        console.error(
            error
        );

        res
            .status(500)
            .json({
                error:
                    'Erro interno do servidor.'
            });
    }
);

/*
 * ======================================================
 * START
 * ======================================================
 */

app.listen(
    port,
    () => {
        console.log(
            `Links PromoShop disponível em http://localhost:${port}`
        );
    }
);