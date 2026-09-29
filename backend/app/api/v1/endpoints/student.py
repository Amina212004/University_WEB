from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import re

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.academic import (
    student_enrollments, student_groups, Level, Group, Section, Module, Semester, TimeSlot, ExamSchedule
)
from app.models.content import CourseMaterial
from app.schemas.academic import ModuleRead, TimeSlotRead, ExamScheduleRead
from app.services.academic_ai_engine import AcademicAiEngine

router = APIRouter()

# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class StudentInfoResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    level: Optional[dict] = None
    section: Optional[dict] = None
    group: Optional[dict] = None
    specialty: Optional[dict] = None
    department: Optional[dict] = None
    faculty: Optional[dict] = None

class MaterialRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    material_type: str
    file_url: str
    created_at: Optional[str] = None
    module_id: int
    module_name: Optional[str] = None

    class Config:
        from_attributes = True

class AiSummarizeRequest(BaseModel):
    material_id: Optional[int] = None
    module_id: Optional[int] = None
    custom_text: Optional[str] = None
    summary_type: str = "general" # 'general' | 'key_concepts' | 'quiz' | 'simplified'

class AiChatRequest(BaseModel):
    message: str
    material_id: Optional[int] = None
    module_id: Optional[int] = None
    history: Optional[List[dict]] = []
    api_key: Optional[str] = None
    model_provider: Optional[str] = None


# ── Helper functions ──────────────────────────────────────────────────────────

def _get_student_level_and_group(db: Session, student_id: int):
    """Récupère le niveau et le groupe d'un étudiant."""
    enrollment = db.execute(
        student_enrollments.select().where(student_enrollments.c.student_id == student_id)
    ).fetchone()
    
    group_row = db.execute(
        student_groups.select().where(student_groups.c.student_id == student_id)
    ).fetchone()

    level = db.query(Level).filter(Level.id == enrollment.level_id).first() if enrollment else None
    group = db.query(Group).filter(Group.id == group_row.group_id).first() if group_row else None
    section = group.section if group else (level.sections[0] if level and level.sections else None)

    return level, group, section


def _extract_text_from_material(material: CourseMaterial) -> str:
    """Extrait le texte lisible du fichier joint s'il s'agit d'un PDF ou texte."""
    if not material.file_url:
        return material.description or ""

    rel_path = material.file_url.lstrip("/").replace("/", os.sep)
    abs_path = os.path.join(os.getcwd(), rel_path)

    if not os.path.exists(abs_path):
        return f"Document: {material.title}. Description: {material.description or 'Aucune description disponible.'}"

    extracted_text = ""
    if abs_path.lower().endswith(".pdf"):
        try:
            import pdfplumber
            with pdfplumber.open(abs_path) as pdf:
                pages_text = []
                for i, page in enumerate(pdf.pages[:30]):
                    txt = page.extract_text()
                    if txt:
                        pages_text.append(txt)
                extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            print(f"Error reading PDF {abs_path}: {e}")

    if not extracted_text.strip():
        extracted_text = f"Titre du document: {material.title}\nDescription: {material.description or 'Contenu du cours.'}"

    return extracted_text


# ── Student Endpoints ─────────────────────────────────────────────────────────

@router.get("/me/info", response_model=StudentInfoResponse)
def get_student_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level, group, section = _get_student_level_and_group(db, current_user.id)
    spec = level.specialty if level else None
    dept = spec.department if spec else None
    fac = dept.faculty if dept else None

    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "level": {"id": level.id, "name": level.name} if level else None,
        "section": {"id": section.id, "name": section.name} if section else None,
        "group": {"id": group.id, "name": group.name} if group else None,
        "specialty": {"id": spec.id, "name": spec.name} if spec else None,
        "department": {"id": dept.id, "name": dept.name} if dept else None,
        "faculty": {"id": fac.id, "name": fac.name} if fac else None,
    }


@router.get("/me/modules")
def get_student_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level, _, _ = _get_student_level_and_group(db, current_user.id)
    if not level:
        return []

    modules = (
        db.query(Module)
        .join(Semester)
        .filter(Semester.level_id == level.id)
        .all()
    )
    return [
        {
            "id": m.id,
            "name": m.name,
            "semester": {"id": m.semester.id, "name": m.semester.name} if m.semester else None
        }
        for m in modules
    ]


@router.get("/me/materials")
def get_student_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level, _, _ = _get_student_level_and_group(db, current_user.id)
    if not level:
        return []

    module_ids = [
        m.id for m in db.query(Module.id).join(Semester).filter(Semester.level_id == level.id).all()
    ]

    materials = (
        db.query(CourseMaterial)
        .filter(CourseMaterial.module_id.in_(module_ids))
        .order_by(CourseMaterial.created_at.desc())
        .all()
    )

    res = []
    for mat in materials:
        mod = db.query(Module).filter(Module.id == mat.module_id).first()
        res.append({
            "id": mat.id,
            "title": mat.title,
            "description": mat.description,
            "material_type": mat.material_type.value if hasattr(mat.material_type, 'value') else str(mat.material_type),
            "file_url": mat.file_url,
            "created_at": str(mat.created_at) if mat.created_at else None,
            "module_id": mat.module_id,
            "module_name": mod.name if mod else f"Module #{mat.module_id}"
        })
    return res


@router.get("/me/timetable")
def get_student_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level, group, section = _get_student_level_and_group(db, current_user.id)
    if not section and not group:
        return []

    from sqlalchemy import or_
    conditions = []
    if section:
        conditions.append(TimeSlot.section_id == section.id)
    if group:
        conditions.append(TimeSlot.group_id == group.id)

    slots = db.query(TimeSlot).filter(or_(*conditions)).all()

    res = []
    for s in slots:
        res.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "session_type": s.session_type.value if hasattr(s.session_type, 'value') else str(s.session_type),
            "room": s.room,
            "module": {"id": s.module.id, "name": s.module.name} if s.module else None,
            "teacher": {"id": s.teacher.id, "first_name": s.teacher.first_name, "last_name": s.teacher.last_name} if s.teacher else None,
        })
    return res


@router.get("/me/exams", response_model=List[ExamScheduleRead])
def get_student_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    level, _, section = _get_student_level_and_group(db, current_user.id)
    if not level:
        return []

    from sqlalchemy import or_
    conds = [ExamSchedule.level_id == level.id]
    if section:
        conds.append(ExamSchedule.section_id == section.id)

    from sqlalchemy.orm import joinedload
    return (
        db.query(ExamSchedule)
        .filter(or_(*conds))
        .options(
            joinedload(ExamSchedule.module),
            joinedload(ExamSchedule.level),
            joinedload(ExamSchedule.section),
            joinedload(ExamSchedule.uploaded_by)
        )
        .order_by(ExamSchedule.exam_date, ExamSchedule.start_time)
        .all()
    )


@router.get("/me/grades")
def get_student_grades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne toutes les notes de l'étudiant connecté,
    groupées par module et type (Examen, TD, TP).
    """
    from app.models.academic import Grade
    from sqlalchemy.orm import joinedload

    grades = (
        db.query(Grade)
        .filter(Grade.student_id == current_user.id)
        .options(
            joinedload(Grade.module),
            joinedload(Grade.uploaded_by),
        )
        .order_by(Grade.module_id, Grade.grade_type)
        .all()
    )

    # Grouper par module
    grouped: dict = {}
    for g in grades:
        mod_id = g.module_id
        mod_name = g.module.name if g.module else f"Module #{mod_id}"
        if mod_id not in grouped:
            grouped[mod_id] = {
                "module_id": mod_id,
                "module_name": mod_name,
                "academic_year": g.academic_year,
                "grades": {},
            }
        grouped[mod_id]["grades"][g.grade_type.value] = {
            "id": g.id,
            "score": g.score,
            "grade_type": g.grade_type.value,
            "uploaded_by": (
                f"{g.uploaded_by.first_name} {g.uploaded_by.last_name}"
                if g.uploaded_by else None
            ),
            "created_at": str(g.created_at) if g.created_at else None,
        }

    return list(grouped.values())


# ── AI Chatbot & Course Summarizer (Ultra Detailed & Exam Focused) ────────────

@router.post("/ai/summarize")
def summarize_course(
    req: AiSummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Génère un résumé académique ultra-détaillé et structuré pour la révision d'examen."""
    material = None
    module = None
    extracted_text = ""

    if req.material_id:
        material = db.query(CourseMaterial).filter(CourseMaterial.id == req.material_id).first()
        if material:
            module = db.query(Module).filter(Module.id == material.module_id).first()
            extracted_text = _extract_text_from_material(material)

    elif req.module_id:
        module = db.query(Module).filter(Module.id == req.module_id).first()
        mats = db.query(CourseMaterial).filter(CourseMaterial.module_id == req.module_id).all()
        texts = [_extract_text_from_material(m) for m in mats]
        extracted_text = "\n\n".join(texts)

    elif req.custom_text:
        extracted_text = req.custom_text

    doc_title = material.title if material else (module.name if module else "Support de Cours")
    mod_title = module.name if module else "Module Académique"

    stype = req.summary_type.lower()

    if stype == "quiz":
        result = AcademicAiEngine.generate_university_exam_quiz(doc_title, mod_title, extracted_text)
        markdown = result["quiz"]
        topics = ["Questions de Cours (6 Pts)", "Exercices Numériques (8 Pts)", "QCM Justifiés (6 Pts)"]
    elif stype in ["practical", "calcul", "exercices"]:
        result = AcademicAiEngine.generate_practical_calculations_summary(doc_title, mod_title, extracted_text)
        markdown = result["summary"]
        topics = result.get("topics", ["Forward Pass & Loss", "Learning Rate Decay", "Gradient Checking", "Weight Decay"])
    elif stype in ["strategy", "decision", "diagnostic"]:
        result = AcademicAiEngine.generate_strategy_decisions_summary(doc_title, mod_title, extracted_text)
        markdown = result["summary"]
        topics = result.get("topics", ["Diagnostic Bias vs Variance", "Choix d'Optimiseur", "Choix de Régularisation", "Tuning Hyperparamètres"])
    elif stype == "key_concepts":
        result = AcademicAiEngine.generate_key_concepts(doc_title, mod_title, extracted_text)
        markdown = result["summary"]
        topics = result.get("topics", ["Glossaire", "Formules", "Règles"])
    elif stype == "simplified":
        result = AcademicAiEngine.generate_simplified(doc_title, mod_title, extracted_text)
        markdown = result["summary"]
        topics = result.get("topics", ["Intuition", "Métaphores", "Compréhension Rapide"])
    else:
        result = AcademicAiEngine.generate_detailed_summary(doc_title, mod_title, extracted_text)
        markdown = result["summary"]
        topics = result.get("topics", ["Batch vs Epoch", "Gradient & Adam", "L1/L2 & Dropout", "Batch Normalization", "Hyperparamètres"])

    return {
        "title": doc_title,
        "module_name": mod_title,
        "summary": markdown,
        "topics": topics,
        "raw_preview": extracted_text[:500]
    }


@router.post("/ai/chat")
def chat_with_ai(
    req: AiChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assistant IA interactif qui répond aux questions de l'étudiant avec précision académique."""
    msg = req.message.strip()
    material = None
    module = None
    extracted_text = ""

    if req.material_id:
        material = db.query(CourseMaterial).filter(CourseMaterial.id == req.material_id).first()
        if material:
            module = db.query(Module).filter(Module.id == material.module_id).first()
            extracted_text = _extract_text_from_material(material)
    elif req.module_id:
        module = db.query(Module).filter(Module.id == req.module_id).first()
        mats = db.query(CourseMaterial).filter(CourseMaterial.module_id == req.module_id).all()
        texts = [_extract_text_from_material(m) for m in mats]
        extracted_text = "\n\n".join(texts)
    else:
        mat = db.query(CourseMaterial).first()
        if mat:
            material = mat
            module = db.query(Module).filter(Module.id == mat.module_id).first()
            extracted_text = _extract_text_from_material(mat)

    mod_name = module.name if module else "vos cours"
    doc_name = material.title if material else ""

    reply = AcademicAiEngine.generate_chat_response(
        msg, mod_name, doc_name, extracted_text, req.history, api_key=req.api_key
    )

    return {
        "reply": reply,
        "module_name": mod_name,
        "material_title": doc_name
    }
