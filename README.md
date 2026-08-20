# 🔗 Links PromoShop

Página de links personalizada e administrável desenvolvida para o **PromoShop**.

O projeto permite centralizar links importantes em uma única página pública, enquanto disponibiliza um painel administrativo para gerenciamento do conteúdo, aparência e configurações da página.

## ✨ Funcionalidades

### Página pública

- Exibição personalizada dos links
- Título e descrição configuráveis
- Identificação automática dos links através de ícones
- Destaque de links importantes
- Layout responsivo para computadores e dispositivos móveis
- Personalização visual da página
- Logo personalizada
- Diferentes estilos para os botões

### Painel administrativo

- Autenticação de administrador
- Adição de novos links
- Edição de links existentes
- Exclusão de links
- Ativação e desativação de links
- Definição de links em destaque
- Personalização das informações da página
- Upload e remoção da logo
- Alteração de configurações visuais
- Alteração de credenciais administrativas

## 🛠️ Tecnologias utilizadas

### Front-end

- React
- Vite
- JavaScript
- CSS
- Lucide React

### Back-end

- Node.js
- Express
- JWT (JSON Web Token)
- Criptografia para armazenamento de informações sensíveis

## 📁 Estrutura do projeto

```text
links-promoshop/
├── data/
│   ├── uploads/
│   └── store.json
├── public/
│   └── favicon.svg
├── server/
│   ├── auth.js
│   ├── index.js
│   ├── secrets.js
│   └── store.js
├── src/
│   ├── main.jsx
│   └── styles.css
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## 🚀 Executando localmente

Clone o repositório:

```bash
git clone https://github.com/Jhonataferreiraar/links-promoshop.git
```

Entre na pasta:

```bash
cd links-promoshop
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente necessárias em um arquivo `.env`.

Exemplo:

```env
ADMIN_USER=
ADMIN_PASSWORD=
JWT_SECRET=
APP_SECRET=
SITE_URL=
```

> ⚠️ Nunca envie o arquivo `.env` ou credenciais reais para o GitHub.

Depois, execute o projeto conforme os scripts disponíveis no `package.json`.

## 🔐 Segurança

O projeto utiliza variáveis de ambiente para manter informações sensíveis fora do código-fonte.

Arquivos contendo credenciais, segredos e dados temporários são ignorados pelo Git através do `.gitignore`.

Entre os arquivos que não devem ser versionados estão:

```text
.env
.env.*
data/secrets.enc
data/*.tmp
```

## 🌐 Deploy

O projeto foi preparado para publicação utilizando o **Render**, com as configurações sensíveis definidas através de variáveis de ambiente na plataforma.

## 📱 Responsividade

A interface foi desenvolvida para funcionar em diferentes tamanhos de tela, incluindo:

- Desktop
- Tablets
- Smartphones

## 📸 Preview

> Adicione aqui futuramente uma imagem da página pública e outra do painel administrativo.

## 👨‍💻 Autor

**Jhonata Ferreira de Araujo**

- GitHub: @Jhonataferreiraar
- LinkedIn: jhonataf-araujo

---

Desenvolvido para o **PromoShop**.