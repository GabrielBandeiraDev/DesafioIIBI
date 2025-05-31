# API de Gerenciamento de Produtos, Vendas e Painéis Analíticos

Esta API fornece uma solução completa para o gerenciamento de produtos, controle de vendas e visualização de dados em tempo real por meio de painéis interativos.

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

## Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/nome-do-repositorio.git
   cd nome-do-repositorio
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

## Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para obter mais detalhes.
