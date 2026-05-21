# Sistema de Gerenciamento Acadêmico

Sistema web completo para gerenciamento acadêmico escolar, desenvolvido com foco em organização institucional, controle de alunos, boletins, turmas, disciplinas e gerenciamento administrativo.

O projeto foi desenvolvido utilizando tecnologias modernas de frontend e backend, com integração ao Supabase para autenticação, banco de dados e políticas de segurança.

---

# Demonstração

> Em desenvolvimento

---

# Objetivos do Projeto

O sistema foi criado com o objetivo de centralizar e automatizar processos acadêmicos comuns em instituições de ensino, permitindo:

* Cadastro e gerenciamento de alunos
* Controle de turmas e disciplinas
* Lançamento de notas e frequência
* Geração de boletins
* Organização por áreas do conhecimento
* Controle de etapas escolares
* Dashboard administrativo
* Sistema de autenticação segura
* Controle de acesso via RLS (Row Level Security)

Além do uso prático, o projeto também faz parte da construção do portfólio profissional e aprofundamento de conhecimentos em desenvolvimento full stack.

---

# Tecnologias Utilizadas

## Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Router DOM
* Lucide React
* html2canvas
* jsPDF

## Backend / Banco de Dados

* Supabase
* PostgreSQL
* Row Level Security (RLS)

---

# Funcionalidades

## Autenticação

* Login de usuários
* Sessão autenticada
* Proteção de rotas
* Controle de permissões

## Dashboard

* Visualização geral do sistema
* Estatísticas acadêmicas
* Indicadores administrativos

## Alunos

* Cadastro de alunos
* Edição e remoção
* Busca e filtros
* Organização por turma

## Turmas

* Cadastro de turmas
* Associação de disciplinas
* Controle de etapas

## Disciplinas

* Cadastro de disciplinas
* Organização por áreas do conhecimento

## Notas e Frequência

* Lançamento de notas
* Registro de frequência
* Cálculo automático de médias
* Média por etapa
* Média anual

## Boletins

* Visualização individual de boletins
* Geração de PDF
* Resumo acadêmico
* Frequência global
* Situação final do aluno

---

# Estrutura do Projeto

```bash
src/
├── components/
├── hooks/
├── layouts/
├── lib/
├── pages/
└── utils/
```

---

# Banco de Dados

O sistema utiliza PostgreSQL através do Supabase.

## Principais entidades

* alunos
* turmas
* disciplinas
* areas
* notas
* etapas
* matriculas
* turma_disciplinas

---

# Segurança

O projeto utiliza:

* Row Level Security (RLS)
* Policies por autenticação
* Controle de acesso por usuário autenticado
* Integração segura com Supabase

---

# Geração de Boletins

O sistema possui geração de boletins em PDF utilizando:

* html2canvas
* jsPDF

Recursos:

* Layout institucional
* Organização por áreas
* Médias automáticas
* Frequência
* Situação final
* Exportação em PDF

---

# Instalação

## Clone o repositório

```bash
git clone https://github.com/MateusLirio3/Sistema_Gerenciamento_Academico.git
```

## Entre na pasta

```bash
cd Sistema_Gerenciamento_Academico
```

## Instale as dependências

```bash
npm install
```

## Configure as variáveis de ambiente

Crie um arquivo `.env`:

```env
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```

## Execute o projeto

```bash
npm run dev
```

---

# Scripts

```bash
npm run dev      # Ambiente de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview da build
```

---

# Status do Projeto

O sistema encontra-se em desenvolvimento ativo.

Funcionalidades já implementadas:

* Estrutura principal
* Dashboard
* CRUD de alunos
* CRUD de turmas
* Sistema de notas
* Geração de boletins
* Integração com Supabase
* Sistema de autenticação
* Segurança com RLS

Funcionalidades futuras:

* Painel de professores
* Sistema de responsáveis
* Notificações
* Histórico escolar
* Relatórios avançados
* Controle de permissões por cargo
* Responsividade aprimorada
* Deploy em produção

---

# Aprendizados

Durante o desenvolvimento deste projeto foram aprofundados conhecimentos em:

* Desenvolvimento Full Stack
* React + TypeScript
* Modelagem de banco de dados
* PostgreSQL
* Supabase
* Segurança com RLS
* Organização de arquitetura frontend
* Geração de PDF
* Gerenciamento de estado
* Integração entre frontend e backend

---

# Autor

Mateus Lírio

* GitHub: [https://github.com/MateusLirio3](https://github.com/MateusLirio3)
* LinkedIn: [www.linkedin.com/in/mateus-lírio-8702b5369](http://www.linkedin.com/in/mateus-lírio-8702b5369)

---

# Licença

Este projeto está sob a licença MIT.
