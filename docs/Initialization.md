# Arquitetura Inicial — App de Gestão Ambiental / Comunicação - AGIR

## Objetivo

Aplicação web/mobile-first para gestão operacional da equipe de Conscientização Ambiental, Revitalização e Comunicação.

Nome: AGIR

O sistema será usado inicialmente por apenas 3 pessoas (uso interno), com foco em:

- agenda e planejamento
- acompanhamento de ações
- mapa operacional
- histórico de revitalizações
- gestão de fotos e evidências
- controle de pontos viciados
- apoio executivo para tomada de decisão

Prioridade máxima:
UX excelente + UI bonita + velocidade + praticidade no uso diário.

Não é um sistema pesado.
É uma ferramenta executiva e operacional.

---

# Stack
## Frontend

- Next.js
- TypeScript
- TailwindCSS
- Shadcn UI
- Framer Motion
- Lucide Icons
- React Hook Form
- Zod
- React Query (TanStack Query)
- Firebase SDK

## Backend

Inicialmente:
- Firebase Firestore
- Firebase Storage

Possível evolução futura:
- AWS S3 (para imagens pesadas / alta resolução)

---

# Design System
## Estilo Visual

Evitar:
- visual pastel excessivo
- bordas grossas
- UI genérica de dashboard padrão
- excesso de borders sólidos

Priorizar:
- visual premium
- clean
- moderno
- elegante
- sensação de software executivo

---

## Background
Base principal:
zinc light

Sugestão:
- bg-zinc-50
- bg-zinc-100

Cards:
- branco puro ou zinc-50

---

## Cor principal (branding)

Gradiente principal:
Purple Gradient

FROM:
#f318e3
TO:
#6a0eaf

Uso:
- botões principais
- CTA
- highlights
- ícones principais
- badges estratégicas
- estados ativos

---

## Estilo de Componentes

- rounded-2xl
- rounded-3xl em cards principais
- sombras suaves e elegantes
- contrastes fortes
- tipografia limpa
- espaçamento respirado
- pouca poluição visual

Preferir:
shadow-md
shadow-lg

Evitar:
border pesada

Preferir:
depth visual com sombra + contraste

---

# Estrutura de Pastas
## Root

/src
/components
/features
/services
/lib
/hooks
/types
/constants
/styles
/docs
/public

---

# Importante

Adicionar no .gitignore:
```gitignore
.env
.env.local
/docs
node_modules
.next
dist
```

# Favicon
Adicionado na pasta public os arquivos "AGIR_logo.png" e "AGIR_logo.svg" Para logos e Favicon da página




