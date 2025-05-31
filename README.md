# API de Gerenciamento de Produtos, Vendas e Painéis Analíticos

Esta aplicação fornece uma solução completa para o gerenciamento de produtos, controle de vendas e visualização de dados em tempo real por meio de painéis interativos. 
desafio solicitado pela empresa IBBI. 


## Visão Geral

O sistema possui:
- **Página de Login** com validação de formulário e integração com backend
- **Dashboard de Vendas** com múltiplas visualizações de dados
- **Conexão em tempo real** via WebSocket para atualizações instantâneas
- **Geração de relatórios** em Excel

## Tecnologias Frontend

- **React** - Biblioteca principal para construção de interfaces
- **Vite** - Ferramenta de build e desenvolvimento
- **TypeScript** - Adiciona tipagem estática ao JavaScript
- **React Icons** - Ícones para a interface
- **Recharts** - Biblioteca para visualização de dados
- **Date-fns** - Manipulação de datas
- **SheetJS (xlsx)** - Geração de relatórios Excel

## Estrutura do Projeto

## Front : 
```
src/
├── components/      # Componentes reutilizáveis
│   ├── ui/          # Componentes de UI básicos
│   └── ...          # Outros componentes
├── pages/           # Páginas da aplicação
│   ├── Login/       # Página de login
│   └── Dashboard/   # Página principal
├── types/           # Tipos TypeScript
└── utils/           # Utilitários e funções auxiliares
```

## Backend : 

```
login/
├── Backeend/      # Componentes reutilizáveis
│   ├── alembic/          # Componentes de UI básicos 
├── main.py/           # Codigo Estruturado dentro da Main.py
├── sql_app.db           # db criado quando rodar uvicorn
└── utils/           # Utilitários e funções auxiliares
```






Página principal com diversas visualizações de dados:

- **Cartões de resumo** (total de vendas, faturamento, ticket médio)
- **Gráfico de tendência** de vendas ao longo do tempo
- **Tabela** com últimas vendas
- **Gráfico de pizza** com vendas por categoria
- **Gráfico de barras** com produtos mais vendidos
- **Notificações em tempo real** via WebSocket
- **Geração de relatórios** em Excel


## Funcionalidades Principais

- **Autenticação de usuários** via JWT (JSON Web Tokens)
- **Operações CRUD** para gerenciamento de produtos
- **Monitoramento e registro de vendas** com histórico completo
- **Painéis analíticos** com dados em tempo real
- **Atualizações em tempo real** via WebSocket
- **Cache com Redis** para melhor desempenho
- **Integração com APIs de câmbio** para conversão de moedas

## Tecnologias Utilizadas

- **FastAPI** - Framework principal para construção da API
- **SQLAlchemy** - ORM para interação com o banco de dados
- **Redis** - Cache em memória para melhor desempenho
- **JWT** - Autenticação segura de usuários
- **WebSocket** - Comunicação em tempo real
- **SQLite** - Banco de dados embutido (pode ser substituído por outros)
- **React + Vite + tsx** - Frontend

## Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone 
   cd backeend
   ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

3. Execute a aplicação:
   ```bash
   python main.py
   ```

   Ou usando o Uvicorn diretamente:
   ```bash
   uvicorn main:app --reload
   ```

## Configuração

Antes de executar, certifique-se de ter:

1. **Redis** instalado e rodando (para cache)
2. Variáveis de ambiente configuradas (se necessário):
   ```
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_DB=0
   ```

## Endpoints Principais

### Autenticação

- `POST /auth/login` - Autenticação de usuário (retorna token JWT)

### Produtos

- `GET /products/` - Lista todos os produtos
- `POST /products/` - Cria um novo produto
- `PUT /products/{product_id}` - Atualiza um produto
- `DELETE /products/{product_id}` - Remove um produto
- `POST /products/purchase/` - Realiza uma compra/venda

### Vendas

- `GET /sales-history/` - Histórico de vendas
- `GET /top-products/` - Produtos mais vendidos
- `GET /sales-trend/` - Tendência de vendas ao longo do tempo
- `GET /sales-by-category/` - Vendas por categoria

### Dashboard

- `GET /dashboard/products/` - Produtos para o dashboard
- `GET /dashboard/sales-analytics/` - Análises de vendas
- `WebSocket /dashboard-ws/` - Conexão WebSocket para atualizações em tempo real

### Outros

- `GET /products/history/` - Histórico de alterações de produtos
- `POST /update_dollar_rate/` - Atualiza a taxa de câmbio

## Documentação Interativa

A API inclui documentação interativa automaticamente gerada pelo FastAPI:

- **Swagger UI**: `http://localhost:8000/docs`
- **Redoc**: `http://localhost:8000/redoc`

## Exemplos de Uso

### Autenticação

```bash
curl -X POST "http://localhost:8000/auth/login" \
-H "Content-Type: application/json" \
-d '{"username": "user@example.com", "password": "secret"}'
```

### Criar Produto

```bash
curl -X POST "http://localhost:8000/products/" \
-H "Authorization: Bearer <SEU_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
    "description": "Novo Produto",
    "image_url": "http://exemplo.com/imagem.jpg",
    "quantity": 10,
    "suggested_quantity": 15,
    "price": 99.90,
    "categories": ["Eletrônicos", "Tecnologia"]
}'
```

### Realizar Venda

```bash
curl -X POST "http://localhost:8000/products/purchase/" \
-H "Authorization: Bearer <SEU_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
    "product_id": 1,
    "quantity": 2
}'
```

## Considerações

1. **Banco de dados**: O projeto usa SQLite por padrão, mas pode ser configurado para outros bancos.
2. **Cache**: Redis é usado para cache, melhorando o desempenho de consultas frequentes.
3. **WebSocket**: Para atualizações em tempo real no dashboard.
4. **Segurança**: Autenticação via JWT com tempo de expiração.

---

## 🧑🏽‍💻 Preto no Branco para DEVs que irão Analisar!

Olá! Aqui estão algumas informações importantes e diretas para quem for analisar o projeto:

---

### 📹 Demonstração do Projeto

* Gravei um vídeo no YouTube testando o sistema na prática:
  👉 [Assista aqui](https://www.youtube.com/watch?v=yVTqT13Fl_k)

---

### 💼 Meu LinkedIn

* Para mais informações sobre minha trajetória profissional, dá uma olhada no meu perfil:
  👉 [linkedin.com/in/gabriel-bandeira-macedo-a2107a139](https://www.linkedin.com/in/gabriel-bandeira-macedo-a2107a139/)

---

### ⚙️ Como rodar o projeto localmente

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/seu-repo.git
   ```

2. No terminal, acesse a pasta do backend:

   ```bash
   cd backeend
   ```

3. Abra outro terminal e vá para o diretório `src`:

   ```bash
   cd src
   ```

4. Execute o backend com o Uvicorn:

   ```bash
   uvicorn main:app --reload
   ```

5. Volte ao terminal raiz e instale as dependências do frontend:

   ```bash
   npm install
   ```

6. Em seguida, inicie o frontend:

   ```bash
   npm run dev
   ```

---

### 📁 Estrutura do Projeto

* O backend está centralizado no arquivo `main.py`.
  Esse projeto foi planejado para ter baixa escalabilidade e ser mantido apenas por mim, o que justificou essa organização mais simples.
  Durante o desafio, também estava envolvido com demandas da minha empresa atual, então priorizei agilidade e clareza.

---

### 🚀 Diferenciais Implementados

✅ **Exportação de dados em Excel (.xlsx)**

* Adicionei um botão "Gerar Relatório" no dashboard.
* O relatório exporta todos os gráficos e estatísticas exibidos.

✅ **Otimização de performance no backend com cache (Redis)**

* Implementei caching em pontos estratégicos para melhorar a latência e escalabilidade da API.

---

### 🛠️ Extras

* Alembic funcionando corretamente para controle de versões no banco de dados.

---

Se precisar de algo, é só me chamar! 😊
Obrigado pela análise!

---




