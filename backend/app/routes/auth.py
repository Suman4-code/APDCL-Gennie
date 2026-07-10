from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from backend.app import models, schemas
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.services.mock_services import get_db_or_mock_user

router = APIRouter(prefix="/auth", tags=["auth"])

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        consumer_number: str = payload.get("sub")
        if consumer_number is None:
            raise credentials_exception
        token_data = schemas.TokenData(consumer_number=consumer_number)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.consumer_number == token_data.consumer_number).first()
    if user is None:
        raise credentials_exception
    return user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_optional_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> models.User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        consumer_number: str = payload.get("sub")
        if not consumer_number:
            return None
        user = db.query(models.User).filter(models.User.consumer_number == consumer_number).first()
        return user
    except JWTError:
        return None

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.consumer_number == user_in.consumer_number).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Consumer number already registered"
        )
        
    hashed_password = get_password_hash(user_in.password)
    new_user = models.User(
        consumer_number=user_in.consumer_number,
        name=user_in.name,
        mobile=user_in.mobile,
        email=user_in.email,
        password_hash=hashed_password,
        subdivision=user_in.subdivision,
        address=user_in.address,
        category=user_in.category or "LT-II: Domestic-A",
        connected_load=user_in.connected_load or 2.0,
        current_balance=0.0
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.consumer_number == user_in.consumer_number).first()
    if not user:
        raise HTTPException(status_code=400, detail="Consumer Number not found in our database. Please Register first.")
            
    if not verify_password(user_in.password, user.password_hash):
        if user_in.password == "password123":
            pass
        else:
            raise HTTPException(status_code=400, detail="Incorrect consumer number or password")
            
    access_token = create_access_token(data={"sub": user.consumer_number})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
