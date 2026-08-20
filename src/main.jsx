import React, {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    createRoot
} from 'react-dom/client';

import {
    Link2,
    ExternalLink,
    Plus,
    Trash2,
    Pencil,
    Eye,
    EyeOff,
    LogOut,
    Settings,
    Shield,
    Home,
    Save,
    X,
    Sparkles,
    Upload,
    Image as ImageIcon
} from 'lucide-react';

import './styles.css';

const fallbackConfig = {
    brandName:
        'PromoShop',

    pageTitle:
        'Links PromoShop',

    headline:
        'Promoções boas estão a um clique.',

    description:
        'Acesse o site oficial da PromoShop e escolha os grupos de ofertas que mais combinam com você.',

    logoUrl:
        '',

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

    showLogo:
        true,

    showFooter:
        true,

    footerText:
        'PromoShop • Encontre ofertas sem perder tempo.',

    disclosure:
        'Podemos receber comissão pelas compras realizadas através de alguns links, sem custo adicional para você.'
};

async function api(
    path,
    options = {}
) {
    const response =
        await fetch(
            `/api${path}`,
            {
                ...options,

                headers: {
                    'Content-Type':
                        'application/json',

                    ...(options.headers ||
                        {})
                }
            }
        );

    const payload =
        await response
            .json()
            .catch(
                () => ({})
            );

    if (
        !response.ok
    ) {
        const error =
            new Error(
                payload.error ||
                'Não foi possível concluir a solicitação.'
            );

        error.status =
            response.status;

        throw error;
    }

    return payload;
}

function applyConfig(
    config
) {
    const root =
        document
            .documentElement;

    root.style.setProperty(
        '--primary',
        config.primaryColor ||
        fallbackConfig
            .primaryColor
    );

    root.style.setProperty(
        '--secondary',
        config.secondaryColor ||
        fallbackConfig
            .secondaryColor
    );

    root.style.setProperty(
        '--background',
        config.backgroundColor ||
        fallbackConfig
            .backgroundColor
    );

    document.title =
        config.pageTitle ||
        'Links PromoShop';

}

/*
 * ======================================================
 * FAVICON AUTOMÁTICO DOS LINKS
 * ======================================================
 */

function LinkFavicon({
    url,
    size = 24
}) {
    const [favicon, setFavicon] = useState('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;

        setFavicon('');
        setFailed(false);

        if (!url) {
            setFailed(true);
            return undefined;
        }

        fetch(
            `/api/favicon?url=${encodeURIComponent(url)}`
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'Favicon não encontrado'
                    );
                }

                return response.json();
            })
            .then((result) => {
                if (!active) return;

                if (result.faviconUrl) {
                    setFavicon(
                        result.faviconUrl
                    );
                } else {
                    setFailed(true);
                }
            })
            .catch(() => {
                if (active) {
                    setFailed(true);
                }
            });

        return () => {
            active = false;
        };
    }, [url]);

    if (
        failed ||
        !favicon
    ) {
        return (
            <Link2
                size={size}
            />
        );
    }

    return (
        <img
            src={favicon}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() =>
                setFailed(true)
            }
        />
    );
}

/*
 * ======================================================
 * SITE PÚBLICO
 * ======================================================
 */

function PublicSite() {
    const [
        config,
        setConfig
    ] = useState(
        fallbackConfig
    );

    const [
        links,
        setLinks
    ] = useState([]);

    const [
        loading,
        setLoading
    ] = useState(true);

    useEffect(
        () => {
            api('/public')
                .then(
                    (result) => {
                        const nextConfig = {
                            ...fallbackConfig,
                            ...(result.config ||
                                {})
                        };

                        setConfig(
                            nextConfig
                        );

                        setLinks(
                            Array.isArray(
                                result.links
                            )
                                ? result.links
                                : []
                        );

                        applyConfig(
                            nextConfig
                        );
                    }
                )
                .catch(
                    console.error
                )
                .finally(
                    () =>
                        setLoading(
                            false
                        )
                );
        },
        []
    );

    const backgroundClass =
        config.backgroundStyle ===
            'solid'
            ? 'solid-background'
            : 'gradient-background';

    const buttonClass =
        `button-style-${config.buttonStyle || 'rounded'}`;

    return (
        <main
            className={`public-page ${backgroundClass}`}
        >
            <div className="background-orb orb-one" />
            <div className="background-orb orb-two" />
            <div className="background-grid" />

            <section className="profile-card">
                {config.showLogo !==
                    false &&
                    config.logoUrl && (
                        <div className="public-logo">
                            <img
                                src={
                                    config.logoUrl
                                }
                                alt={
                                    config.brandName
                                }
                            />
                        </div>
                    )}

                <span className="public-label">
                    LINKS OFICIAIS
                </span>

                <h1>
                    {config.headline}
                </h1>

                <p className="public-description">
                    {config.description}
                </p>

                <div className="link-list">
                    {loading && (
                        <div className="loading-card">
                            Carregando links…
                        </div>
                    )}

                    {!loading &&
                        links.map(
                            (link) => {
                                return (
                                    <a
                                        href={
                                            link.url
                                        }
                                        className={`public-link ${buttonClass} ${link.featured
                                            ? 'featured'
                                            : ''
                                            }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        key={
                                            link.id
                                        }
                                    >
                                        <span className="public-link-icon">
                                            <LinkFavicon
                                                url={link.url}
                                                size={28}
                                            />
                                        </span>

                                        <span className="public-link-copy">
                                            <strong>
                                                {
                                                    link.title
                                                }
                                            </strong>

                                            {link.subtitle && (
                                                <small>
                                                    {
                                                        link.subtitle
                                                    }
                                                </small>
                                            )}
                                        </span>

                                        {link.featured && (
                                            <span className="featured-badge">
                                                <Sparkles
                                                    size={
                                                        13
                                                    }
                                                />
                                                Destaque
                                            </span>
                                        )}

                                        <ExternalLink
                                            className="public-link-arrow"
                                            size={
                                                18
                                            }
                                        />
                                    </a>
                                );
                            }
                        )}

                    {!loading &&
                        !links.length && (
                            <div className="empty-public">
                                Nenhum link disponível no momento.
                            </div>
                        )}
                </div>

                {config.showFooter !==
                    false && (
                        <footer className="public-footer">
                            <strong>
                                {
                                    config.footerText
                                }
                            </strong>

                            <p>
                                {
                                    config.disclosure
                                }
                            </p>
                        </footer>
                    )}
            </section>
        </main>
    );
}

/*
 * ======================================================
 * LOGIN
 * ======================================================
 */

function Login({
    onLogin
}) {
    const [
        username,
        setUsername
    ] = useState('');

    const [
        password,
        setPassword
    ] = useState('');

    const [
        error,
        setError
    ] = useState('');

    const [
        loading,
        setLoading
    ] = useState(false);

    async function submit(
        event
    ) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const result =
                await api(
                    '/auth/login',
                    {
                        method:
                            'POST',

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );

            localStorage.setItem(
                'links_promoshop_token',
                result.token
            );

            onLogin(
                result.token
            );
        } catch (
        error
        ) {
            setError(
                error.message
            );
        } finally {
            setLoading(
                false
            );
        }
    }

    return (
        <main className="login-page">
            <form
                className="login-card"
                onSubmit={
                    submit
                }
            >
                <a
                    href="/"
                    className="admin-logo"
                >
                    <img
                        src="/favicon.svg"
                        alt="PromoShop"
                    />
                </a>

                <span className="admin-eyebrow">
                    ÁREA RESTRITA
                </span>

                <h1>
                    Painel administrativo
                </h1>

                <p>
                    Gerencie a sua página de links da PromoShop.
                </p>

                <label>
                    Usuário

                    <input
                        value={
                            username
                        }
                        onChange={
                            (
                                event
                            ) =>
                                setUsername(
                                    event
                                        .target
                                        .value
                                )
                        }
                        required
                        autoComplete="username"
                    />
                </label>

                <label>
                    Senha

                    <input
                        type="password"
                        value={
                            password
                        }
                        onChange={
                            (
                                event
                            ) =>
                                setPassword(
                                    event
                                        .target
                                        .value
                                )
                        }
                        required
                        autoComplete="current-password"
                    />
                </label>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                <button
                    className="primary-button"
                    disabled={
                        loading
                    }
                >
                    {loading
                        ? 'Entrando…'
                        : 'Entrar'}
                </button>

                <a
                    className="back-home"
                    href="/"
                >
                    ← Voltar para o site
                </a>
            </form>
        </main>
    );
}

/*
 * ======================================================
 * ADMIN
 * ======================================================
 */

const emptyLink = {
    title: '',
    subtitle: '',
    url: '',
    enabled: true,
    featured: false,
    order: 1
};

function AdminApp() {
    const [
        token,
        setToken
    ] = useState(
        localStorage.getItem(
            'links_promoshop_token'
        )
    );

    const [
        tab,
        setTab
    ] = useState(
        'links'
    );

    const [
        data,
        setData
    ] = useState({
        config:
            fallbackConfig,

        links: [],

        secrets: {}
    });

    const [
        newLink,
        setNewLink
    ] = useState(
        emptyLink
    );

    const [
        editingLink,
        setEditingLink
    ] = useState(
        null
    );

    const [
        message,
        setMessage
    ] = useState('');

    const [
        loading,
        setLoading
    ] = useState(false);

    const [
        logoUploading,
        setLogoUploading
    ] = useState(false);

    const [
        security,
        setSecurity
    ] = useState({
        adminUser: '',
        adminPassword: ''
    });

    const authApi = (
        path,
        options = {}
    ) =>
        api(
            path,
            {
                ...options,

                headers: {
                    ...(options.headers ||
                        {}),

                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    async function load() {
        if (!token) {
            return;
        }

        try {
            const result =
                await authApi(
                    '/admin/dashboard'
                );

            setData(
                result
            );

            setSecurity(
                (
                    current
                ) => ({
                    ...current,

                    adminUser:
                        result
                            .secrets
                            ?.adminUser ||
                        ''
                })
            );
        } catch (
        error
        ) {
            if (
                error.status ===
                401
            ) {
                localStorage.removeItem(
                    'links_promoshop_token'
                );

                setToken(
                    null
                );
            }
        }
    }

    useEffect(
        () => {
            if (token) {
                load();
            }
        },
        [token]
    );

    useEffect(
        () => {
            if (!message) {
                return;
            }

            const timeout =
                window.setTimeout(
                    () =>
                        setMessage(
                            ''
                        ),
                    4000
                );

            return () =>
                window.clearTimeout(
                    timeout
                );
        },
        [message]
    );

    function logout() {
        localStorage.removeItem('links_promoshop_token');
        setToken(null);
    }

    const orderedLinks =
        useMemo(
            () =>
                [...data.links]
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
                    ),
            [data.links]
        );

    if (!token) {
        return (
            <Login
                onLogin={
                    setToken
                }
            />
        );
    }

    async function saveConfig(
        event
    ) {
        event.preventDefault();

        setLoading(true);

        try {
            await authApi(
                '/admin/config',
                {
                    method:
                        'PUT',

                    body:
                        JSON.stringify(
                            data.config
                        )
                }
            );

            await load();

            setMessage(
                'Aparência atualizada.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        } finally {
            setLoading(
                false
            );
        }
    }

    async function uploadLogo(
        event
    ) {
        const file =
            event
                .target
                .files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/webp'
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {
            setMessage(
                'Use uma imagem PNG, JPG ou WEBP.'
            );

            event.target.value =
                '';

            return;
        }

        if (
            file.size >
            2 * 1024 * 1024
        ) {
            setMessage(
                'A logo deve possuir no máximo 2 MB.'
            );

            event.target.value =
                '';

            return;
        }

        setLogoUploading(
            true
        );

        try {
            const formData =
                new FormData();

            formData.append(
                'logo',
                file
            );

            const response =
                await fetch(
                    '/api/admin/logo',
                    {
                        method:
                            'POST',

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            formData
                    }
                );

            const result =
                await response
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !response.ok
            ) {
                throw new Error(
                    result.error ||
                    'Não foi possível enviar a logo.'
                );
            }

            await load();

            setMessage(
                'Logo atualizada com sucesso.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        } finally {
            setLogoUploading(
                false
            );

            event.target.value =
                '';
        }
    }


    async function removeLogo() {
        try {
            await authApi(
                '/admin/logo',
                {
                    method:
                        'DELETE'
                }
            );

            await load();

            setMessage(
                'Logo removida.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }

    async function addLink(
        event
    ) {
        event.preventDefault();

        try {
            await authApi(
                '/admin/links',
                {
                    method:
                        'POST',

                    body:
                        JSON.stringify(
                            newLink
                        )
                }
            );

            setNewLink({
                ...emptyLink,

                order:
                    data.links
                        .length +
                    1
            });

            await load();

            setMessage(
                'Link adicionado.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }

    async function saveLink(
        event
    ) {
        event.preventDefault();

        if (
            !editingLink?.id
        ) {
            return;
        }

        try {
            await authApi(
                `/admin/links/${editingLink.id}`,
                {
                    method:
                        'PUT',

                    body:
                        JSON.stringify(
                            editingLink
                        )
                }
            );

            setEditingLink(
                null
            );

            await load();

            setMessage(
                'Link atualizado.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }

    async function removeLink(
        link
    ) {
        const confirmed =
            window.confirm(
                `Excluir "${link.title}"?`
            );

        if (
            !confirmed
        ) {
            return;
        }

        try {
            await authApi(
                `/admin/links/${link.id}`,
                {
                    method:
                        'DELETE'
                }
            );

            await load();

            setMessage(
                'Link excluído.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }

    async function toggleLink(
        link
    ) {
        try {
            await authApi(
                `/admin/links/${link.id}`,
                {
                    method:
                        'PUT',

                    body:
                        JSON.stringify({
                            enabled:
                                !link.enabled
                        })
                }
            );

            await load();
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }

    async function saveSecurity(
        event
    ) {
        event.preventDefault();

        try {
            const result =
                await authApi(
                    '/admin/security',
                    {
                        method:
                            'PUT',

                        body:
                            JSON.stringify(
                                security
                            )
                    }
                );

            setSecurity(
                (
                    current
                ) => ({
                    ...current,

                    adminPassword:
                        ''
                })
            );

            if (
                result.requiresLogin
            ) {
                localStorage.removeItem(
                    'links_promoshop_token'
                );

                setToken(
                    null
                );

                return;
            }

            await load();

            setMessage(
                'Credenciais atualizadas.'
            );
        } catch (
        error
        ) {
            setMessage(
                error.message
            );
        }
    }



    const nav = [
        {
            id: 'links',
            label: 'Links',
            icon: Link2
        },

        {
            id: 'appearance',
            label: 'Aparência',
            icon: Settings
        },

        {
            id: 'security',
            label: 'Segurança',
            icon: Shield
        }
    ];

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <a
                    href="/"
                    className="admin-logo"
                >
                    {data.config?.logoUrl ? (
                        <img
                            src={data.config.logoUrl}
                            alt="PromoShop"
                        />
                    ) : (
                        <Link2 size={28} />
                    )}
                </a>

                <div className="admin-navigation">
                    {nav.map(
                        (item) => {
                            const Icon =
                                item.icon;

                            return (
                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    className={
                                        tab ===
                                            item.id
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={
                                        () =>
                                            setTab(
                                                item.id
                                            )
                                    }
                                >
                                    <Icon
                                        size={
                                            18
                                        }
                                    />

                                    {
                                        item.label
                                    }
                                </button>
                            );
                        }
                    )}
                </div>

                <div className="sidebar-bottom">
                    <a
                        href="/"
                        target="_blank"
                    >
                        <Home
                            size={
                                17
                            }
                        />
                        Ver página
                    </a>

                    <button
                        type="button"
                        onClick={
                            logout
                        }
                    >
                        <LogOut
                            size={
                                17
                            }
                        />
                        Sair
                    </button>
                </div>
            </aside>

            <main className="admin-content">
                <header className="admin-header">
                    <div>
                        <span className="admin-eyebrow">
                            LINKS PROMOSHOP
                        </span>

                        <h1>
                            {tab ===
                                'links'
                                ? 'Gerenciar links'
                                : tab ===
                                    'appearance'
                                    ? 'Aparência do site'
                                    : 'Segurança'}
                        </h1>
                    </div>

                    <a
                        href="/"
                        target="_blank"
                        className="preview-button"
                    >
                        <Eye
                            size={
                                17
                            }
                        />
                        Visualizar site
                    </a>
                </header>

                {message && (
                    <div className="admin-toast">
                        {message}

                        <button
                            type="button"
                            onClick={
                                () =>
                                    setMessage(
                                        ''
                                    )
                            }
                        >
                            <X
                                size={
                                    16
                                }
                            />
                        </button>
                    </div>
                )}

                {tab ===
                    'links' && (
                        <>
                            <section className="admin-panel">
                                <div className="panel-heading">
                                    <div>
                                        <span>
                                            NOVO LINK
                                        </span>

                                        <h2>
                                            Adicionar botão
                                        </h2>

                                        <p>
                                            Adicione site, grupo do WhatsApp ou outra rede.
                                        </p>
                                    </div>
                                </div>

                                <form
                                    className="link-form"
                                    onSubmit={
                                        addLink
                                    }
                                >
                                    <label>
                                        Título
                                        <input
                                            required
                                            value={
                                                newLink.title
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setNewLink({
                                                        ...newLink,

                                                        title:
                                                            event
                                                                .target
                                                                .value
                                                    })
                                            }
                                            placeholder="Ofertas de Tecnologia"
                                        />
                                    </label>

                                    <label>
                                        Descrição
                                        <input
                                            value={
                                                newLink.subtitle
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setNewLink({
                                                        ...newLink,

                                                        subtitle:
                                                            event
                                                                .target
                                                                .value
                                                    })
                                            }
                                            placeholder="Celulares, notebooks e eletrônicos"
                                        />
                                    </label>

                                    <label className="wide">
                                        URL
                                        <input
                                            required
                                            type="url"
                                            value={
                                                newLink.url
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setNewLink({
                                                        ...newLink,

                                                        url:
                                                            event
                                                                .target
                                                                .value
                                                    })
                                            }
                                            placeholder="https://..."
                                        />
                                    </label>

                                    <label>
                                        Ordem

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                newLink.order
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setNewLink({
                                                        ...newLink,

                                                        order:
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                    })
                                            }
                                        />
                                    </label>

                                    <label className="checkbox-card">
                                        <input
                                            type="checkbox"
                                            checked={
                                                newLink.featured
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setNewLink({
                                                        ...newLink,

                                                        featured:
                                                            event
                                                                .target
                                                                .checked
                                                    })
                                            }
                                        />

                                        <span>
                                            <strong>
                                                Destacar
                                            </strong>

                                            <small>
                                                Dá mais visibilidade ao botão.
                                            </small>
                                        </span>
                                    </label>

                                    <button className="primary-button add-link-button">
                                        <Plus
                                            size={
                                                18
                                            }
                                        />
                                        Adicionar link
                                    </button>
                                </form>
                            </section>

                            <section className="admin-panel">
                                <div className="panel-heading">
                                    <div>
                                        <span>
                                            PUBLICADOS
                                        </span>

                                        <h2>
                                            Seus links
                                        </h2>

                                        <p>
                                            {
                                                orderedLinks.length
                                            } link
                                            {orderedLinks.length ===
                                                1
                                                ? ''
                                                : 's'}{' '}
                                            cadastrado
                                            {orderedLinks.length ===
                                                1
                                                ? ''
                                                : 's'}.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-link-list">
                                    {orderedLinks.map(
                                        (link) => {

                                            return (
                                                <article
                                                    className="admin-link-item"
                                                    key={
                                                        link.id
                                                    }
                                                >
                                                    <span className="admin-link-icon">
                                                        <LinkFavicon
                                                            url={link.url}
                                                            size={24}
                                                        />
                                                    </span>

                                                    <span className="admin-link-info">
                                                        <strong>
                                                            {
                                                                link.title
                                                            }
                                                        </strong>

                                                        <small>
                                                            {link.subtitle ||
                                                                link.url}
                                                        </small>

                                                        <em>
                                                            Ordem{' '}
                                                            {
                                                                link.order
                                                            }
                                                            {link.featured
                                                                ? ' · Destaque'
                                                                : ''}
                                                        </em>
                                                    </span>

                                                    <span
                                                        className={`link-status ${link.enabled
                                                            ? 'enabled'
                                                            : ''
                                                            }`}
                                                    >
                                                        {link.enabled
                                                            ? 'Ativo'
                                                            : 'Oculto'}
                                                    </span>

                                                    <div className="admin-link-actions">
                                                        <button
                                                            type="button"
                                                            title={
                                                                link.enabled
                                                                    ? 'Ocultar'
                                                                    : 'Exibir'
                                                            }
                                                            onClick={
                                                                () =>
                                                                    toggleLink(
                                                                        link
                                                                    )
                                                            }
                                                        >
                                                            {link.enabled ? (
                                                                <Eye
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            ) : (
                                                                <EyeOff
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Editar"
                                                            onClick={
                                                                () =>
                                                                    setEditingLink({
                                                                        ...link
                                                                    })
                                                            }
                                                        >
                                                            <Pencil
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="danger-icon"
                                                            title="Excluir"
                                                            onClick={
                                                                () =>
                                                                    removeLink(
                                                                        link
                                                                    )
                                                            }
                                                        >
                                                            <Trash2
                                                                size={
                                                                    17
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                {tab ===
                    'appearance' && (
                        <form
                            className="admin-panel appearance-form"
                            onSubmit={
                                saveConfig
                            }
                        >
                            <div className="panel-heading">
                                <div>
                                    <span>
                                        PERSONALIZAÇÃO
                                    </span>

                                    <h2>
                                        Página pública
                                    </h2>

                                    <p>
                                        Altere textos, cores, logo e aparência.
                                    </p>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <label>
                                    Nome da marca
                                    <input
                                        value={
                                            data.config
                                                .brandName ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        brandName:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label>
                                    Título da aba
                                    <input
                                        value={
                                            data.config
                                                .pageTitle ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        pageTitle:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label className="wide">
                                    Título principal

                                    <input
                                        value={
                                            data.config
                                                .headline ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        headline:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label className="wide">
                                    Descrição

                                    <textarea
                                        value={
                                            data.config
                                                .description ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        description:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <div className="logo-upload-field wide">
                                    <div className="logo-upload-title">
                                        <span>
                                            Logo da página
                                        </span>

                                        <small>
                                            A logo aparece no topo da página pública.
                                            O favicon da aba continua sendo /favicon.svg.
                                        </small>
                                    </div>

                                    <div className="logo-upload-content">
                                        <div className="logo-preview">
                                            {data.config
                                                .logoUrl ? (
                                                <img
                                                    src={
                                                        data.config
                                                            .logoUrl
                                                    }
                                                    alt="Logo atual"
                                                />
                                            ) : (
                                                <ImageIcon
                                                    size={32}
                                                />
                                            )}
                                        </div>

                                        <div className="logo-upload-actions">
                                            <label className="upload-button">
                                                <input
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                                    onChange={
                                                        uploadLogo
                                                    }
                                                    disabled={
                                                        logoUploading
                                                    }
                                                />

                                                <Upload
                                                    size={17}
                                                />

                                                {logoUploading
                                                    ? 'Enviando…'
                                                    : data.config
                                                        .logoUrl
                                                        ? 'Trocar logo'
                                                        : 'Enviar logo'}
                                            </label>

                                            {data.config
                                                .logoUrl && (
                                                    <button
                                                        className="remove-logo-button"
                                                        type="button"
                                                        onClick={
                                                            removeLogo
                                                        }
                                                    >
                                                        <Trash2
                                                            size={16}
                                                        />

                                                        Remover
                                                    </button>
                                                )}
                                        </div>
                                    </div>

                                    <small className="logo-upload-help">
                                        Formatos permitidos: PNG, JPG e WEBP.
                                        Tamanho máximo: 2 MB.
                                    </small>
                                </div>

                                <label>
                                    Cor principal
                                    <input
                                        type="color"
                                        value={
                                            data.config
                                                .primaryColor ||
                                            '#1269f3'
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        primaryColor:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label>
                                    Cor secundária
                                    <input
                                        type="color"
                                        value={
                                            data.config
                                                .secondaryColor ||
                                            '#6c5ce7'
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        secondaryColor:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label>
                                    Cor de fundo
                                    <input
                                        type="color"
                                        value={
                                            data.config
                                                .backgroundColor ||
                                            '#07111f'
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        backgroundColor:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label>
                                    Fundo

                                    <select
                                        value={
                                            data.config
                                                .backgroundStyle ||
                                            'gradient'
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        backgroundStyle:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    >
                                        <option value="gradient">
                                            Gradiente
                                        </option>

                                        <option value="solid">
                                            Cor sólida
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Formato dos botões

                                    <select
                                        value={
                                            data.config
                                                .buttonStyle ||
                                            'rounded'
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        buttonStyle:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    >
                                        <option value="rounded">
                                            Arredondado
                                        </option>

                                        <option value="pill">
                                            Cápsula
                                        </option>

                                        <option value="square">
                                            Quadrado
                                        </option>
                                    </select>
                                </label>

                                <label className="checkbox-card">
                                    <input
                                        type="checkbox"
                                        checked={
                                            data.config
                                                .showLogo !==
                                            false
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        showLogo:
                                                            event
                                                                .target
                                                                .checked
                                                    }
                                                })
                                        }
                                    />

                                    <span>
                                        <strong>
                                            Mostrar logo
                                        </strong>
                                        <small>
                                            Exibe o logo no topo.
                                        </small>
                                    </span>
                                </label>

                                <label className="checkbox-card">
                                    <input
                                        type="checkbox"
                                        checked={
                                            data.config
                                                .showFooter !==
                                            false
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        showFooter:
                                                            event
                                                                .target
                                                                .checked
                                                    }
                                                })
                                        }
                                    />

                                    <span>
                                        <strong>
                                            Mostrar rodapé
                                        </strong>
                                        <small>
                                            Exibe os textos finais.
                                        </small>
                                    </span>
                                </label>

                                <label className="wide">
                                    Texto do rodapé

                                    <input
                                        value={
                                            data.config
                                                .footerText ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        footerText:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>

                                <label className="wide">
                                    Aviso de afiliado

                                    <textarea
                                        value={
                                            data.config
                                                .disclosure ||
                                            ''
                                        }
                                        onChange={
                                            (
                                                event
                                            ) =>
                                                setData({
                                                    ...data,

                                                    config: {
                                                        ...data.config,

                                                        disclosure:
                                                            event
                                                                .target
                                                                .value
                                                    }
                                                })
                                        }
                                    />
                                </label>
                            </div>

                            <button
                                className="primary-button save-button"
                                disabled={
                                    loading
                                }
                            >
                                <Save
                                    size={
                                        18
                                    }
                                />
                                Salvar aparência
                            </button>
                        </form>
                    )}

                {tab ===
                    'security' && (
                        <form
                            className="admin-panel security-form"
                            onSubmit={
                                saveSecurity
                            }
                        >
                            <div className="panel-heading">
                                <div>
                                    <span>
                                        ACESSO
                                    </span>

                                    <h2>
                                        Credenciais administrativas
                                    </h2>

                                    <p>
                                        Altere o usuário ou a senha do painel.
                                    </p>
                                </div>
                            </div>

                            <label>
                                Usuário administrador

                                <input
                                    required
                                    value={
                                        security
                                            .adminUser
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setSecurity({
                                                ...security,

                                                adminUser:
                                                    event
                                                        .target
                                                        .value
                                            })
                                    }
                                />
                            </label>

                            <label>
                                Nova senha

                                <input
                                    type="password"
                                    minLength={
                                        12
                                    }
                                    value={
                                        security
                                            .adminPassword
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setSecurity({
                                                ...security,

                                                adminPassword:
                                                    event
                                                        .target
                                                        .value
                                            })
                                    }
                                    placeholder="Deixe vazio para manter a senha atual"
                                    autoComplete="new-password"
                                />

                                <small>
                                    Mínimo de 12 caracteres. Ao alterar a senha, todas as sessões abertas serão encerradas.
                                </small>
                            </label>

                            <button className="primary-button save-button">
                                <Shield
                                    size={
                                        18
                                    }
                                />
                                Atualizar segurança
                            </button>
                        </form>
                    )}
            </main>

            {editingLink && (
                <div
                    className="modal-backdrop"
                    onMouseDown={
                        () =>
                            setEditingLink(
                                null
                            )
                    }
                >
                    <form
                        className="edit-modal"
                        onSubmit={
                            saveLink
                        }
                        onMouseDown={
                            (
                                event
                            ) =>
                                event
                                    .stopPropagation()
                        }
                    >
                        <div className="modal-heading">
                            <span>
                                EDITAR LINK
                            </span>

                            <button
                                type="button"
                                onClick={
                                    () =>
                                        setEditingLink(
                                            null
                                        )
                                }
                            >
                                <X
                                    size={
                                        18
                                    }
                                />
                            </button>
                        </div>

                        <label>
                            Título

                            <input
                                required
                                value={
                                    editingLink
                                        .title
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEditingLink({
                                            ...editingLink,

                                            title:
                                                event
                                                    .target
                                                    .value
                                        })
                                }
                            />
                        </label>

                        <label>
                            Descrição

                            <input
                                value={
                                    editingLink
                                        .subtitle ||
                                    ''
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEditingLink({
                                            ...editingLink,

                                            subtitle:
                                                event
                                                    .target
                                                    .value
                                        })
                                }
                            />
                        </label>

                        <label>
                            URL

                            <input
                                required
                                type="url"
                                value={
                                    editingLink
                                        .url
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEditingLink({
                                            ...editingLink,

                                            url:
                                                event
                                                    .target
                                                    .value
                                        })
                                }
                            />
                        </label>

                        <div className="modal-grid">

                            <label>
                                Ordem

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        editingLink
                                            .order ||
                                        1
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            setEditingLink({
                                                ...editingLink,

                                                order:
                                                    Number(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                            })
                                    }
                                />
                            </label>
                        </div>

                        <label className="checkbox-card">
                            <input
                                type="checkbox"
                                checked={
                                    Boolean(
                                        editingLink
                                            .featured
                                    )
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEditingLink({
                                            ...editingLink,

                                            featured:
                                                event
                                                    .target
                                                    .checked
                                        })
                                }
                            />

                            <span>
                                <strong>
                                    Destacar link
                                </strong>
                            </span>
                        </label>

                        <label className="checkbox-card">
                            <input
                                type="checkbox"
                                checked={
                                    editingLink
                                        .enabled !==
                                    false
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setEditingLink({
                                            ...editingLink,

                                            enabled:
                                                event
                                                    .target
                                                    .checked
                                        })
                                }
                            />

                            <span>
                                <strong>
                                    Link ativo
                                </strong>
                            </span>
                        </label>

                        <button className="primary-button">
                            <Save
                                size={
                                    18
                                }
                            />
                            Salvar alterações
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

const isAdmin =
    window.location.pathname
        .startsWith(
            '/admin'
        );

createRoot(
    document.getElementById(
        'root'
    )
).render(
    <React.StrictMode>
        {isAdmin
            ? <AdminApp />
            : <PublicSite />}
    </React.StrictMode>
);