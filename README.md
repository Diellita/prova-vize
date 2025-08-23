Vize — Solicitação de Antecipação de Parcelas (API)

Projeto de prova técnica: módulo de Solicitação de Antecipação de Parcelas.

Stack

.NET 8 / C#

ASP.NET Core Web API

Entity Framework Core + PostgreSQL

JWT (mock) para autenticação

Migrations + Seed automático no startup

Mock de dados em mock/contracts.json

Como rodar
1) Pré-requisitos

.NET 8 SDK

PostgreSQL 15+ (local ou via Docker)

2) Banco de dados

Configure a connection string em backend/WebApi/appsettings.json (chave ConnectionStrings:Default), ex.(Host=localhost;Port=5432;Database=vize;Username=postgres;Password=postgres;)

A API aplica as migrations automaticamente no startup.

3) Subir a API

No terminal:

cd backend/WebApi
dotnet run

Você verá algo como: Now listening on: http://localhost:5275

(Use essa porta nos testes.)


Regras de negócio (resumo)

Apenas parcelas com vencimento > 30 dias podem ser antecipadas.

O cliente não pode ter outra solicitação PENDENTE.

Ao aprovar, registrar ApprovedAt e marcar parcelas como ANTECIPADA.

O cliente só pode solicitar para o próprio contrato.

Enums usados (salvos como int no banco):

InstallmentStatus: A_VENCER=0, PAGO=1, AGUARDANDO_APROVACAO=2, ANTECIPADA=3

AdvanceRequestStatus: PENDENTE=0, APROVADO=1, REPROVADO=2


Autenticação (mock JWT)

Endpoint: POST /auth/token
Regra simples: se o e-mail contém aprovador → role = APROVADOR, senão CLIENTE.

Cliente de teste (seed): cliente.demo@vize.local → terá clientId=1 no token.

Aprovador de teste: use qualquer e-mail com “aprovador”, ex.: aprovador.demo@vize.local.

Exemplo (cliente):

curl -s -X POST http://localhost:5275/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente.demo@vize.local","password":"123"}'


Exemplo (aprovador):


curl -s -X POST http://localhost:5275/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"aprovador.demo@vize.local","password":"123"}'


Endpoints principais
Criar solicitação (CLIENTE)

POST /advance-request

curl -s -X POST http://localhost:5275/advance-request \
  -H "Authorization: Bearer <TOKEN_CLIENTE>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId":1,"notes":"Teste"}'


Detalhe da solicitação (CLIENTE/APROVADOR)

GET /advance-request/{id}

curl -s http://localhost:5275/advance-request/1 \
  -H "Authorization: Bearer <TOKEN_APROVADOR>"


Listar solicitações do cliente (CLIENTE)

GET /advance-request?status=PENDENTE&startDate=...&endDate=...&page=1&pageSize=10

curl -s "http://localhost:5275/advance-request?page=1&pageSize=10" \
  -H "Authorization: Bearer <TOKEN_CLIENTE>"


Listar para aprovador (todas) (APROVADOR)

GET /advance-request/admin?status=PENDENTE&page=1&pageSize=10


Listar para aprovador (todas) (APROVADOR)

GET /advance-request/admin?status=PENDENTE&page=1&pageSize=10


Aprovação em massa (APROVADOR)

PUT /advance-request/approve

curl -i -X PUT http://localhost:5275/advance-request/approve \
  -H "Authorization: Bearer <TOKEN_APROVADOR>" \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2,3]}'


Retorno esperado: 204 No Content.

Rejeição em massa (APROVADOR)

PUT /advance-request/reject


curl -i -X PUT http://localhost:5275/advance-request/reject \
  -H "Authorization: Bearer <TOKEN_APROVADOR>" \
  -H "Content-Type: application/json" \
  -d '{"ids":[4,5]}'

Retorno esperado: 204 No Content.

Seed de dados

Ao iniciar a API, o DbSeeder cria:

1 USUÁRIO CLIENTE e 1 USUÁRIO APROVADOR

1 CLIENTE (id = 1) vinculado ao usuário cliente

1 CONTRATO (CONTRATO-001) com 3 parcelas:

1 paga, 1 a vencer (<30d), 1 elegível (>30d)

Para testar o fluxo: gere TOKEN_CLIENTE, crie uma solicitação; depois gere TOKEN_APROVADOR e aprove/rejeite em massa.

Mock JSON

Arquivo requerido pela prova: mock/contracts.json
Ele não é lido pela API, serve de referência/documentação do modelo.
IDs inteiros e status alinhados com os enums do projeto.


Observações

As migrations e o seed rodam automaticamente no startup.

O banco usa o schema public com tabelas tbl*.

O campo status no banco é integer por ser enum no C#.

Qualquer dúvida sobre setup, verifique a porta que a API abriu no console.















