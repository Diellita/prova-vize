# Vize - Sistema de Antecipação

Projeto fullstack com **React + TypeScript + Vite** no frontend e **.NET 8 (ASP.NET Core)** no backend.  
Desenvolvido para gerenciar solicitações de antecipação de parcelas, com perfis **Cliente** e **Aprovador**.

---

## 🚀 Tecnologias

- **Frontend**
  - React + TypeScript
  - Vite
  - TailwindCSS
  - SweetAlert2
  - Axios

- **Backend**
  - .NET 8 (ASP.NET Core Web API)
  - Entity Framework Core
  - PostgreSQL

---

## ⚙️ Funcionalidades

- **Cliente**
  - Autenticação e login
  - Visualização e criação de solicitações de antecipação
  - Acompanhamento do status das solicitações

- **Aprovador**
  - Visualização das solicitações pendentes
  - Aprovação ou reprovação em lote
  - Filtros e status destacados

---

## ▶️ Como rodar o projeto

### Backend
1. Acesse a pasta `backend`:
   ```sh
   cd backend/WebApi
   ```
2. Execute as migrações (se necessário):
   ```sh
   dotnet ef database update
   ```
3. Rode a API:
   ```sh
   dotnet run
   ```
   Por padrão, disponível em: **http://localhost:5275**

### Frontend
1. Acesse a pasta `front`:
   ```sh
   cd front
   ```
2. Instale as dependências:
   ```sh
   npm install
   ```
3. Rode o projeto:
   ```sh
   npm run dev
   ```
   Por padrão, disponível em: **http://localhost:5173**

---

## 👥 Perfis de acesso (seed)
- **Aprovador**
  - Email: `aprovador.demo@vize.com`
  - Senha: `123456`

- **Clientes (exemplos seed)**
  - Ana Sousa — `ana.sousa@vize.com` / `as123456`
  - João Ribeiro — `joao.ribeiro@vize.com` / `jr123456`
  - Regina Falange — `regina.falange@vize.com` / `rf123456`
  - Gabriel Alves — `gabriel.alves@vize.com` / `ga123456`
  - Lucas Machado — `lucas.machado@vize.com` / `lm123456`
  - Pedro Rocha — `pedro.rocha@vize.com` / `pr123456`
  - Renato Santos — `renato.santos@vize.com` / `rs123456`
  - Fátima Mohamad — `fatima.mohamad@vize.com` / `fm123456`
  - Ibrahim Mustafa — `ibrahim.mustafa@vize.com` / `im123456`
  - Hideki Suzuki — `hideki.suzuki@vize.com` / `hs123456`

---

## 📌 Observações

- O aprovador pode visualizar e gerenciar **todas** as solicitações.
- Cada cliente só enxerga **suas próprias** solicitações e contratos.
- O fluxo de aprovação/reprovação atualiza automaticamente os status de parcelas e contratos.

---

