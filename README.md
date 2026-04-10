# Focus Grid SMART

Sistema de gerenciamento de tarefas pessoais com foco em produtividade, execucao diaria e metodologia SMART.

## Stack

- React + Vite + TypeScript
- Firebase Auth (Google)
- Firestore para persistencia em nuvem
- TailwindCSS para interface
- Migracao automatica do historico salvo em LocalStorage

## Funcionalidades

- CRUD completo de tarefas
- Login com Google
- Sincronizacao por usuario em tempo real com Firestore
- Estrutura SMART por tarefa:
  - specific
  - measurable
  - achievable
  - relevant
  - timeBound
- Organizacao por secoes: Hoje, Atrasadas e Concluidas
- Filtro por status: todo, doing e done
- Cards com status visual e cores por prioridade
- Barra de progresso geral
- Contador de tarefas concluidas no dia
- Drag and drop entre status
- Feedback visual ao concluir tarefa
- Layout com header e sidebar

## Estrutura de codigo

- src/components
  - TaskCard
  - TaskForm
- src/pages
  - Dashboard
- src/hooks
  - useTasks
- src/types
  - task
- src/services
  - localStorage

## Como iniciar

```bash
npm install
npm run dev
```

## Configuracao Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Google.
3. Ative o Firestore Database.
4. Copie `.env.example` para `.env` e preencha as variaveis `VITE_FIREBASE_*`.

Exemplo de regras iniciais do Firestore (ajuste para producao):

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/responsaveis/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/locais/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/workspaces/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Build de producao:

```bash
npm run build
```
