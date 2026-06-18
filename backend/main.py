from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config.settings import settings
from config.database import engine
from utils.logger import setup_logging, get_logger
from middleware.error_handlers import register_error_handlers
from api.routes import (
    auth_router,
    users_router,
    questions_router,
    offer_letters_router,
    answers_router,
    submissions_router,
)

setup_logging()
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", env=settings.APP_ENV)
    yield
    await engine.dispose()
    logger.info("shutdown")


app = FastAPI(
    title="Offer Letter Portal API",
    description="API for managing offer letters, candidate responses, and digital signatures.",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(questions_router, prefix=API_PREFIX)
app.include_router(offer_letters_router, prefix=API_PREFIX)
app.include_router(answers_router, prefix=API_PREFIX)
app.include_router(submissions_router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
