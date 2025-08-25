# Vize — Solicitação de Antecipação de Parcelas (API + Frontend)

Módulo de **Solicitação de Antecipação de Parcelas** para CRM imobiliário.

---

## 📦 Stack

### Backend
- .NET 8 / C#
- ASP.NET Core Web API
- Entity Framework Core + PostgreSQL
- Autenticação JWT (mock)
- Migrations + Seed automático no startup
- Mock de dados em `mock/contracts.json` (documentação de modelo)

### Frontend
- React + Vite + TypeScript
- React Router
- Axios com **interceptor 401 → /login**
- Tailwind utilitário (classes) em alguns componentes

---

## 🚀 Como rodar

### 1) Pré-requisitos
- .NET 8 SDK  
- PostgreSQL 15+ (local ou Docker)  
- Node 18+ (para o frontend)  

### 2) Banco de dados
No arquivo **backend/WebApi/appsettings.json**, configure a connection string (chave `ConnectionStrings:Default`), ex.:

```txt
Host=localhost;Port=5432;Database=vize;Username=postgres;Password=postgres;
```

A API aplica as **migrations automaticamente** no startup.

### 3) Subir a API
```bash
cd backend/WebApi
dotnet run
```

Você verá algo como:

```txt
Now listening on: http://localhost:5275
```

> **Importante:** use a porta exibida no console. Se necessário, ajuste o baseURL do frontend.

### 4) Subir o Frontend
```bash
cd front
npm i
npm run dev
```

Acesse em: [http://localhost:5173](http://localhost:5173)

---

## 🔐 Autenticação (mock JWT)

**Endpoint:** `POST /auth/token`  
**Regra:** se o e-mail contém `aprovador` → role = `APROVADOR`, senão `CLIENTE`.

- **Cliente de teste (seed):** `cliente.demo@vize.local` ⇒ terá `clientId=1` no token.  
- **Aprovador de teste (qualquer e-mail com "aprovador"):** `aprovador.demo@vize.local`.

Exemplos:

```bash
# CLIENTE
curl -s -X POST http://localhost:5275/auth/token   -H "Content-Type: application/json"   -d '{"email":"cliente.demo@vize.local","password":"123"}'

# APROVADOR
curl -s -X POST http://localhost:5275/auth/token   -H "Content-Type: application/json"   -d '{"email":"aprovador.demo@vize.local","password":"123"}'
```

O frontend salva **token**, **role** e **userId** no `localStorage`.

---

## 🔄 Fluxo de uso

### CLIENTE (rota `/lista`)
- Lista as **minhas solicitações** (`GET /advance-request`).
- **Criar solicitação** (`POST /advance-request`):
  - Selecionar **contrato** e **parcela elegível**.
  - Regras aplicadas (também devem ser validadas no backend):
    - Apenas parcelas com **status "A VENCER"** e **vencimento > 30 dias**.
    - Se existe alguma parcela em **"AGUARDANDO_APROVACAO"**, bloqueia novas solicitações.
    - Cliente só solicita **para o próprio contrato**.
  - Observações vão em `notes`. Se houver parcela selecionada, prefixamos com `[PARCELA N]`.

### APROVADOR (rota `/admin`)
- Lista **todas as solicitações** (`GET /advance-request/admin`).
- **Aprovação em massa**: `PUT /advance-request/approve` com `{ "ids": [...] }`.
- **Reprovação em massa**:
  - Se existir `PUT /advance-request/reject`, usar `{ "ids": [...] }`.
  - Caso contrário, o front envia `{ "ids": [...], "status": "REPROVADO" }`.  
    → Se o backend não suportar, mostra erro claro.

---

## 🛡️ Guards e UX (frontend)

- `CLIENTE` → `/lista`  
- `APROVADOR` → `/admin`  
- Sem token/role: redireciona para `/login`.  
- **401 global:** interceptor limpa credenciais e redireciona para `/login`.  
- **Logout:** acessar `/logout`.  

> Base URL configurável em `front/src/lib/api.ts`  
> Padrão: `http://localhost:5290` (ajuste conforme a porta real, ex.: `5275`).  

---

## 📑 Endpoints principais

### Criar solicitação (CLIENTE)
```bash
POST /advance-request
{
  "contratoId": 1,
  "notes": "Teste"
}
```

### Detalhe da solicitação
```bash
GET /advance-request/{id}
```

### Minhas solicitações (CLIENTE)
```bash
GET /advance-request
```

### Lista do aprovador (APROVADOR)
```bash
GET /advance-request/admin
```

### Aprovação em massa
```bash
PUT /advance-request/approve
{ "ids": [1,2,3] }
```

### Rejeição em massa
```bash
# A) Endpoint dedicado
PUT /advance-request/reject
{ "ids": [4,5] }

# B) Mesmo endpoint de approve com status
PUT /advance-request/approve
{ "ids": [4,5], "status": "REPROVADO" }
```

---

## 📌 Regras de negócio

- Apenas parcelas com vencimento **> 30 dias** podem ser antecipadas.  
- **Apenas uma solicitação pendente por cliente**.  
- Ao aprovar, registrar `ApprovedAt` e marcar parcelas como **ANTECIPADA**.  
- Cliente só pode solicitar para **seu próprio contrato**.  

**Enums** (salvos como int no banco):  
- `InstallmentStatus`: `A_VENCER=0`, `PAGO=1`, `AGUARDANDO_APROVACAO=2`, `ANTECIPADA=3`  
- `AdvanceRequestStatus`: `PENDENTE=0`, `APROVADO=1`, `REPROVADO=2`  

---

## 🌱 Seed de dados

No startup, o `DbSeeder` cria:
- 1 usuário **CLIENTE** e 1 **APROVADOR**  
- 1 cliente (id=1) vinculado ao usuário cliente  
- 1 contrato (`CONTRATO-001`) com 3 parcelas:  
  - 1 paga, 1 a vencer (<30d), 1 elegível (>30d)  

> O arquivo **`mock/contracts.json`** é o **requerido pela prova** (referência do modelo).  
> Ele **não é lido pela API**, apenas documenta o schema.  

---

## ⚡ Teste rápido do fluxo

1. Gere token do **CLIENTE** e crie solicitação:
```bash
curl -s -X POST http://localhost:5275/advance-request   -H "Authorization: Bearer <TOKEN_CLIENTE>"   -H "Content-Type: application/json"   -d '{"contratoId":1,"notes":"Teste"}'
```

2. Gere token do **APROVADOR** e aprove em massa:
```bash
curl -i -X PUT http://localhost:5275/advance-request/approve   -H "Authorization: Bearer <TOKEN_APROVADOR>"   -H "Content-Type: application/json"   -d '{"ids":[1,2,3]}'
```

---

## 🛠️ Troubleshooting

- **401 contínuo** → token expirado ou removido. O interceptor limpa e redireciona para `/login`.  
- **CORS** → garantir que a API libera `http://localhost:5173–5186`.  
- **Porta errada** → confira no console da API (ex.: 5275) e ajuste `front/src/lib/api.ts`.  
- **Cache do Vite** → pare e rode `npm run dev` de novo.  
- **Rejeição não funciona** → backend pode não suportar. Use o formato B ou implemente `/advance-request/reject`.  
