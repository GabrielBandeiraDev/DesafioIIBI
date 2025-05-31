# - API para Gerenciamento de Produtos, Vendas e Painéis Analíticos
# - Esta API fornece uma solução completa para o gerenciamento de produtos, controle de vendas e visualização de dados em tempo real por meio de painéis interativos.
# - Funcionalidades:
# - Autenticação de usuários via JWT
# - Operações CRUD para gerenciamento de produtos
# - Monitoramento e registro de vendas
# - Atualizações em tempo real por meio de WebSocket
# - Cache com Redis para maior desempenho
# - Integração com APIs de taxas de câmbio
# - Observações Técnicas:

####################################################################################################
#  Todas as funcionalidades foram integradas em um único arquivo main.py                                                                                       
#  visando otimizar o tempo disponível para o desenvolvimento da solução dentro do prazo do desafio.
#  considerando também limitações de tempo no trabalho.(meu trabalho atual)  
####################################################################################################




# ===================== IMPORTS E CONFIGS IMPORTANTES =====================

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional, List
import requests
from enum import Enum
from fastapi import Query
from sqlalchemy import create_engine, Column, Integer, String, Float, Enum as SQLEnum, func
from sqlalchemy.ext.declarative import declarative_base
import redis
from functools import wraps
import os
import pickle

# Configurações
SECRET_KEY = "SECRET_123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
CACHE_EXPIRE_SECONDS = 300  

# Configuração do Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Inicializa o Redis
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=False
)


# ===================== DATABASE MODELOS =====================

Base = declarative_base()

class Status(str, Enum):
    red = "red"
    yellow = "yellow"
    green = "green"

class DashboardProduct(Base):
    __tablename__ = "dashboard_products"
    
    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, index=True)  
    description = Column(String)
    image_url = Column(String)
    initial_quantity = Column(Integer)  
    sold_quantity = Column(Integer, default=0)  
    current_quantity = Column(Integer) 
    suggested_quantity = Column(Integer)
    price_brl = Column(Float)
    price_usd = Column(Float)
    status = Column(SQLEnum(Status))
    categories = Column(String)
    owner = Column(String)
    last_update = Column(String, default=datetime.utcnow().isoformat())
    is_active = Column(Integer, default=1)  

class ProductHistory(Base):
    __tablename__ = "products_history"
    
    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(Integer, index=True)  
    description = Column(String)
    image_url = Column(String)
    quantity = Column(Integer)
    suggested_quantity = Column(Integer)
    price_brl = Column(Float)
    price_usd = Column(Float)
    status = Column(SQLEnum(Status))
    categories = Column(String)
    owner = Column(String)
    action = Column(String) 
    action_date = Column(String, default=datetime.utcnow().isoformat())
    action_reason = Column(String, nullable=True)  

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    image_url = Column(String)
    quantity = Column(Integer)
    suggested_quantity = Column(Integer)
    price_brl = Column(Float)
    price_usd = Column(Float)
    status = Column(SQLEnum(Status))
    categories = Column(String)
    owner = Column(String)

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    quantity = Column(Integer)
    sale_date = Column(String, default=datetime.utcnow().isoformat())
    sale_value_brl = Column(Float)
    sale_value_usd = Column(Float)
    owner = Column(String)

# ===================== PYDANTIC MODELOS =====================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class ProductBase(BaseModel):
    description: str
    image_url: str
    quantity: int
    suggested_quantity: int
    price: float
    categories: List[str]

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    status: Status
    price_usd: float
    owner: str

    class Config:
        from_attributes = True

class PurchaseRequest(BaseModel):
    product_id: int
    quantity: int

class SaleResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    sale_date: str
    sale_value_brl: float
    sale_value_usd: float
    owner: str

    class Config:
        from_attributes = True



# ===================== INICIALIZAÇÃO =====================



app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis Configuration
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Authentication Utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Fake user database
fake_users_db = {
    "user@example.com": {
        "username": "user@example.com",
        "email": "user@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
    }
}

# Global variables
current_dollar_rate = 5.0
active_connections = []
active_connections_ws2 = {}



# ===================== FUNC. P/ AJUDAR   =====================

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_dollar_exchange_rate():
    try:
        response = requests.get("https://economia.awesomeapi.com.br/json/last/USD-BRL")
        data = response.json()
        return float(data["USDBRL"]["bid"])
    except Exception as e:
        print(f"Error fetching dollar rate: {e}")
        return 5.0  # Default value

def calculate_status(quantity: int, suggested_quantity: int) -> Status:
    if quantity < suggested_quantity:
        return Status.red
    elif (quantity - suggested_quantity) <= 5:
        return Status.yellow
    else:
        return Status.green

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def update_product_prices(db: Session):
    products = db.query(Product).all()
    for product in products:
        product.price_usd = round(product.price_brl / current_dollar_rate, 2)
    db.commit()

async def broadcast_message(message: str, message_type: str = "notification"):
    for connection in active_connections:
        try:
            await connection.send_json({
                "type": message_type,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            })
        except:
            active_connections.remove(connection)

def create_initial_products(db: Session, owner: str):
    if db.query(Product).count() == 0:
        initial_products = [
            {
                "description": "Notebook Dell Inspiron",
                "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45",
                "quantity": 15,
                "suggested_quantity": 10,
                "price_brl": 4500.00,
                "price_usd": round(4500.00 / current_dollar_rate, 2),
                "status": calculate_status(15, 10),
                "categories": "Eletrônicos",
                "owner": owner
            },
            {
                "description": "Camiseta Branca Básica",
                "image_url": "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9",
                "quantity": 8,
                "suggested_quantity": 12,
                "price_brl": 59.90,
                "price_usd": round(59.90 / current_dollar_rate, 2),
                "status": calculate_status(8, 12),
                "categories": "Roupas",
                "owner": owner
            },
            {
                "description": "Arroz Integral 5kg",
                "image_url": "https://images.unsplash.com/photo-1547496502-affa22d38842",
                "quantity": 20,
                "suggested_quantity": 25,
                "price_brl": 22.50,
                "price_usd": round(22.50 / current_dollar_rate, 2),
                "status": calculate_status(20, 25),
                "categories": "Alimentos",
                "owner": owner
            }
        ]
        
        for product_data in initial_products:
            db_product = Product(**product_data)
            db.add(db_product)
        db.commit()

def generate_color_for_category(category_name: str) -> str:
    colors = {
        "Eletrônicos": "#f87171",
        "Roupas": "#60a5fa",
        "Alimentos": "#34d399",
        "Livros": "#facc15",
        "Casa": "#a78bfa",
        "Brinquedos": "#fb923c"
    }
    return colors.get(category_name, "#" + "%06x" % (hash(category_name) % 0xFFFFFF))

def cache_response(key_prefix: str, expire: int = CACHE_EXPIRE_SECONDS):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{str(kwargs)}"
            cached_data = redis_client.get(cache_key)
            if cached_data is not None:
                return pickle.loads(cached_data)
            
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expire, pickle.dumps(result))
            return result
        return wrapper
    return decorator

def invalidate_cache(key_prefix: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            keys = redis_client.keys(f"{key_prefix}:*")
            if keys:
                redis_client.delete(*keys)
            
            if key_prefix == "products":
                redis_client.delete(*redis_client.keys("dashboard:*"))
                redis_client.delete(*redis_client.keys("sales:*"))
            return result
        return wrapper
    return decorator

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ===================== Autenticação   =====================

@app.post("/auth/login", response_model=Token)
async def login_for_access_token(login_data: LoginRequest):
    user = authenticate_user(fake_users_db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ===================== PRODUTOS E HISTORICO  =====================

@app.post("/products/purchase/")
async def purchase_product(
    purchase: PurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(
        Product.id == purchase.product_id,
        Product.owner == current_user.username
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if db_product.quantity < purchase.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    # Registrar a venda
    sale = Sale(
        product_id=purchase.product_id,
        quantity=purchase.quantity,
        sale_value_brl=db_product.price_brl * purchase.quantity,
        sale_value_usd=db_product.price_usd * purchase.quantity,
        owner=current_user.username
    )
    db.add(sale)
    
    # Sincronizar com o dashboard ANTES de atualizar
    sync_product_to_dashboard(db, db_product)
    
    # Atualizar o estoque principal
    db_product.quantity -= purchase.quantity
    db_product.status = calculate_status(db_product.quantity, db_product.suggested_quantity)
    
    if db_product.quantity <= 0:
        # Atualiza o dashboard antes de remover
        update_dashboard_sale(db, sale)
        db.delete(db_product)
        message_action = "removed"
    else:
        # Atualiza o estoque e o dashboard
        db.commit()
        update_dashboard_sale(db, sale)
        message_action = "updated"
    
    # Preparar mensagem para o WebSocket
    message = {
        "type": "new_sale",
        "data": {
            "product_id": purchase.product_id,
            "product_description": db_product.description,
            "quantity": purchase.quantity,
            "value": db_product.price_brl * purchase.quantity,
            "action": message_action
        }
    }
    
    await broadcast_dashboard_update(current_user.username, message)
    return {"message": "Compra realizada com sucesso", "product": db_product.description}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/products/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    status = calculate_status(product.quantity, product.suggested_quantity)
    
    db_product = Product(
        description=product.description,
        image_url=product.image_url,
        quantity=product.quantity,
        suggested_quantity=product.suggested_quantity,
        price_brl=product.price,
        price_usd=round(product.price / current_dollar_rate, 2),
        status=status,
        categories=",".join(product.categories),
        owner=current_user.username
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return ProductResponse(
        id=db_product.id,
        description=db_product.description,
        image_url=db_product.image_url,
        quantity=db_product.quantity,
        suggested_quantity=db_product.suggested_quantity,
        price=db_product.price_brl,
        price_usd=db_product.price_usd,
        status=db_product.status,
        categories=db_product.categories.split(","),
        owner=db_product.owner
    )

@app.get("/products/", response_model=List[ProductResponse])
async def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    description: Optional[str] = Query(None),
    categories: Optional[str] = Query(None)
):
    query = db.query(Product).filter(Product.owner == current_user.username)

    if description:
        query = query.filter(Product.description.ilike(f"%{description}%"))
    
    if categories:
        categories_list = categories.split(",")
        query = query.filter(Product.categories.in_(categories_list))

    db_products = query.all()

    return [
        ProductResponse(
            id=p.id,
            description=p.description,
            image_url=p.image_url,
            quantity=p.quantity,
            suggested_quantity=p.suggested_quantity,
            price=p.price_brl,
            price_usd=p.price_usd,
            status=p.status,
            categories=p.categories.split(","),
            owner=p.owner
        ) for p in db_products
    ]

@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.owner == current_user.username
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_product.description = product.description
    db_product.image_url = product.image_url
    db_product.quantity = product.quantity
    db_product.suggested_quantity = product.suggested_quantity
    db_product.price_brl = product.price
    db_product.price_usd = round(product.price / current_dollar_rate, 2)
    db_product.status = calculate_status(product.quantity, product.suggested_quantity)
    db_product.categories = ",".join(product.categories)
    
    db.commit()
    db.refresh(db_product)
    
    return db_product

@app.delete("/products/{product_id}", response_model=ProductResponse)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.owner == current_user.username
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    
    return db_product

@app.post("/products/purchase/")
async def purchase_product(
    purchase: PurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_product = db.query(Product).filter(
        Product.id == purchase.product_id,
        Product.owner == current_user.username
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if db_product.quantity < purchase.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    # Registrar a venda
    sale = Sale(
        product_id=purchase.product_id,
        quantity=purchase.quantity,
        sale_value_brl=db_product.price_brl * purchase.quantity,
        sale_value_usd=db_product.price_usd * purchase.quantity,
        owner=current_user.username
    )
    db.add(sale)
    
    # Atualizar o estoque
    db_product.quantity -= purchase.quantity
    db_product.status = calculate_status(db_product.quantity, db_product.suggested_quantity)
    
    if db_product.quantity <= 0:
        db.delete(db_product)
        db.commit()
        message = f"Produto {db_product.description} comprado e removido do estoque."
    else:
        db.commit()
        message = f"Produto {db_product.description} comprado com sucesso!"
    
    await broadcast_message(message)
    return {"message": message}

@app.get("/top-products/")
async def get_top_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    top_products = (
        db.query(
            Product.description,
            func.sum(Sale.quantity).label('total_sales'),
            func.sum(Sale.sale_value_brl).label('total_revenue')
        )
        .join(Sale, Sale.product_id == Product.id)
        .filter(Sale.owner == current_user.username)
        .group_by(Product.description)
        .order_by(func.sum(Sale.quantity).desc())
        .limit(10)
        .all()
    )
    
    return [{
        "name": product[0], 
        "sales": product[1],
        "revenue": product[2]
    } for product in top_products]

@app.get("/sales-trend/")
async def get_sales_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    # Filtro básico - você pode melhorar isso
    sales = (
        db.query(Sale)
        .filter(Sale.owner == current_user.username)
        .order_by(Sale.sale_date)
        .all()
    )
    
    # Agrupar por dia (simplificado)
    daily_sales = {}
    for sale in sales:
        sale_date = datetime.fromisoformat(sale.sale_date).date()
        if sale_date not in daily_sales:
            daily_sales[sale_date] = 0
        daily_sales[sale_date] += sale.sale_value_brl
    
    # Converter para o formato esperado pelo frontend
    trend_data = [{
        "date": date.isoformat(),
        "total": total
    } for date, total in daily_sales.items()]
    
    return trend_data

@app.get("/sales-by-category/")
async def get_sales_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    # Implementação melhorada
    query = (
        db.query(
            Product.categories,
            func.sum(Sale.quantity).label('total_quantity'),
            func.sum(Sale.sale_value_brl).label('total_revenue')
        )
        .join(Sale, Sale.product_id == Product.id)
        .filter(Sale.owner == current_user.username)
    )
    
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    
    results = query.group_by(Product.categories).all()
    
    categories = []
    for cat, qty, revenue in results:
        if cat:
            categories.append({
                "name": cat.split(',')[0],  # Pega a primeira categoria
                "sales": qty,
                "revenue": revenue,
                "color": generate_color_for_category(cat)
            })
    
    return categories

@app.get("/sales-history/", response_model=List[SaleResponse])
async def get_sales_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(100, gt=0, le=1000),
    offset: int = Query(0, ge=0)
):
    sales = (
        db.query(Sale)
        .filter(Sale.owner == current_user.username)
        .order_by(Sale.sale_date.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return sales

@app.post("/reset-sales/")
async def reset_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.query(Sale).filter(Sale.owner == current_user.username).delete()
    db.commit()
    return {"message": "Todas as vendas foram removidas com sucesso."}

@app.get("/categories/")
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    results = db.query(Product.categories).filter(Product.owner == current_user.username).all()
    category_set = set()
    for row in results:
        if row[0]:
            categories = [cat.strip() for cat in row[0].split(',')]
            category_set.update(categories)
    return sorted(category_set)

@app.post("/update_dollar_rate/")
async def update_dollar_rate(
    new_rate: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    global current_dollar_rate
    current_dollar_rate = new_rate
    update_product_prices(db)
    await broadcast_message(f"Novo valor do dólar: {new_rate}")
    return {"message": "Dollar rate updated", "new_rate": new_rate}

@app.get("/products/history/", response_model=List[dict])
async def get_products_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    product_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100
):
    query = db.query(ProductHistory).filter(
        ProductHistory.owner == current_user.username
    ).order_by(ProductHistory.action_date.desc())
    
    if product_id:
        query = query.filter(ProductHistory.original_id == product_id)
    
    if action:
        query = query.filter(ProductHistory.action == action)
    
    history = query.limit(limit).all()
    
    return [{
        "id": h.id,
        "original_id": h.original_id,
        "description": h.description,
        "action": h.action,
        "action_date": h.action_date,
        "action_reason": h.action_reason,
        "quantity": h.quantity,
        "price_brl": h.price_brl,
        "status": h.status
    } for h in history]


# ===================== DASHBOARD =====================

@app.websocket("/dashboard-ws/")
async def dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    
    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if not username or username not in fake_users_db:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except JWTError as e:
            print(f"JWT Error: {e}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Adiciona a conexão à lista específica do dashboard
        if username not in active_connections_ws2:
            active_connections_ws2[username] = []
        active_connections_ws2[username].append(websocket)
        
        try:
            while True:
                # Manter conexão aberta
                data = await websocket.receive_text()
                print(f"Message received: {data}")
        except WebSocketDisconnect:
            print("Client disconnected")
        finally:
            if username in active_connections_ws2:
                active_connections_ws2[username].remove(websocket)
                if not active_connections_ws2[username]:
                    del active_connections_ws2[username]
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)

@app.get("/dashboard/products/", response_model=List[dict])
async def get_dashboard_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    show_inactive: bool = False
):
    query = db.query(DashboardProduct).filter(
        DashboardProduct.owner == current_user.username
    )
    
    if not show_inactive:
        query = query.filter(DashboardProduct.is_active == 1)
    
    products = query.order_by(DashboardProduct.last_update.desc()).all()
    
    return [{
        "id": p.id,
        "original_id": p.original_id,
        "description": p.description,
        "image_url": p.image_url,
        "initial_quantity": p.initial_quantity,
        "sold_quantity": p.sold_quantity,
        "current_quantity": p.current_quantity,
        "suggested_quantity": p.suggested_quantity,
        "price_brl": p.price_brl,
        "price_usd": p.price_usd,
        "status": p.status,
        "categories": p.categories.split(",") if p.categories else [],
        "last_update": p.last_update,
        "is_active": bool(p.is_active)
    } for p in products]

@app.get("/dashboard/sales-analytics/")
async def get_sales_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    period: str = "month"  # day, week, month, year
):
    # Implementação da análise de vendas por período
    pass

def create_initial_sales(db: Session, owner: str):
    # Removendo as vendas iniciais
    pass

def sync_product_to_dashboard(db: Session, product: Product, action: str = "create_or_update"):
    db_dash_product = db.query(DashboardProduct).filter(
        DashboardProduct.original_id == product.id,
        DashboardProduct.owner == product.owner
    ).first()
    
    if db_dash_product:
        db_dash_product.description = product.description
        db_dash_product.image_url = product.image_url
        db_dash_product.current_quantity = product.quantity
        db_dash_product.suggested_quantity = product.suggested_quantity
        db_dash_product.price_brl = product.price_brl
        db_dash_product.price_usd = product.price_usd
        db_dash_product.status = product.status
        db_dash_product.categories = product.categories
        db_dash_product.last_update = datetime.utcnow().isoformat()
        db_dash_product.is_active = 1 if product.quantity > 0 else 0
    else:
        dash_product = DashboardProduct(
            original_id=product.id,
            description=product.description,
            image_url=product.image_url,
            initial_quantity=product.quantity,
            current_quantity=product.quantity,
            suggested_quantity=product.suggested_quantity,
            price_brl=product.price_brl,
            price_usd=product.price_usd,
            status=product.status,
            categories=product.categories,
            owner=product.owner,
            is_active=1
        )
        db.add(dash_product)
    db.commit()

def update_dashboard_sale(db: Session, sale: Sale):
    dash_product = db.query(DashboardProduct).filter(
        DashboardProduct.original_id == sale.product_id,
        DashboardProduct.owner == sale.owner
    ).first()
    
    if dash_product:
        dash_product.sold_quantity += sale.quantity
        dash_product.current_quantity = dash_product.initial_quantity - dash_product.sold_quantity
        dash_product.status = calculate_status(dash_product.current_quantity, dash_product.suggested_quantity)
        dash_product.last_update = datetime.utcnow().isoformat()
        dash_product.is_active = 1 if dash_product.current_quantity > 0 else 0
        db.commit()

async def broadcast_dashboard_update(username: str, message: dict):
    if username in active_connections_ws2:
        for connection in active_connections_ws2[username]:
            try:
                await connection.send_json(message)
            except:
                active_connections_ws2[username].remove(connection)
                if not active_connections_ws2[username]:
                    del active_connections_ws2[username]


# ===================== INIT DB =====================


def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        current_dollar_rate = get_dollar_exchange_rate()
        owner = "user@example.com"
        create_initial_products(db, owner)
        create_initial_sales(db, owner)
        
        # Registrar produtos iniciais no histórico
        products = db.query(Product).all()
        for product in products:
            history_entry = ProductHistory(
                original_id=product.id,
                description=product.description,
                image_url=product.image_url,
                quantity=product.quantity,
                suggested_quantity=product.suggested_quantity,
                price_brl=product.price_brl,
                price_usd=product.price_usd,
                status=product.status,
                categories=product.categories,
                owner=product.owner,
                action="created",
                action_reason="Initial setup"
            )
            db.add(history_entry)
        db.commit()
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

# Inicializa o banco de dados
init_db()



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)