from __future__ import annotations

from collections.abc import Callable

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.response import ErrorEnvelope


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        payload = ErrorEnvelope(message=str(exc.detail))
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(_: Request, exc: ValidationError) -> JSONResponse:
        payload = ErrorEnvelope(message="Validation error", errors=exc.errors())
        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(IntegrityError)
    async def integrity_exception_handler(_: Request, exc: IntegrityError) -> JSONResponse:
        payload = ErrorEnvelope(message="Database constraint violation")
        return JSONResponse(status_code=409, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        payload = ErrorEnvelope(message="Internal server error")
        return JSONResponse(status_code=500, content=payload.model_dump())
