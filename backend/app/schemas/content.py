from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from app.models.content import MaterialType, ExamDraftStatus
from app.schemas.user import UserRead

# ─── Course Material Schemas ──────────────────────────────────────────────

class CourseMaterialBase(BaseModel):
    title: str
    description: Optional[str] = None
    material_type: MaterialType
    module_id: int
    level_id: Optional[int] = None
    section_id: Optional[int] = None
    group_id: Optional[int] = None

class CourseMaterialCreate(CourseMaterialBase):
    pass

class CourseMaterialResponse(CourseMaterialBase):
    id: int
    file_url: str
    teacher_id: int
    created_at: datetime
    teacher: UserRead

    class Config:
        from_attributes = True


# ─── Exam Draft Schemas ───────────────────────────────────────────────────

class ExamDraftBase(BaseModel):
    title: str
    module_id: int

class ExamDraftCreate(ExamDraftBase):
    pass

class ExamDraftResponse(ExamDraftBase):
    id: int
    file_url: str
    status: ExamDraftStatus
    admin_feedback: Optional[str] = None
    teacher_id: int
    created_at: datetime
    teacher: UserRead

    class Config:
        from_attributes = True

class ExamDraftReview(BaseModel):
    status: ExamDraftStatus
    admin_feedback: Optional[str] = None
