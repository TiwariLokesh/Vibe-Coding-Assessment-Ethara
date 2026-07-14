from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

DataT = TypeVar("DataT")


class SuccessResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str
    data: DataT | None = None
    model_config = ConfigDict(from_attributes=True)


class ErrorEnvelope(BaseModel):
    success: bool = False
    message: str
    errors: list[dict[str, object]] | None = None
