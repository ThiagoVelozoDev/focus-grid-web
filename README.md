# Focus Grid SMART

Sistema de gerenciamento de tarefas pessoais com foco em produtividade, execucao diaria e metodologia SMART.

## Stack

- React + Vite + TypeScript
- Zustand para estado global
- TailwindCSS para interface
- Persistencia automatica com LocalStorage

## Funcionalidades

- CRUD completo de tarefas
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

Build de producao:

```bash
npm run build
```
