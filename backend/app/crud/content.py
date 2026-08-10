from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.content import CourseMaterial, ExamDraft, ExamDraftStatus
from app.schemas.content import CourseMaterialCreate, ExamDraftCreate, ExamDraftReview

def create_course_material(db: Session, material: CourseMaterialCreate, teacher_id: int, file_url: str):
    db_material = CourseMaterial(
        title=material.title,
        description=material.description,
        material_type=material.material_type,
        module_id=material.module_id,
        level_id=material.level_id,
        section_id=material.section_id,
        group_id=material.group_id,
        teacher_id=teacher_id,
        file_url=file_url
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

def get_module_materials(
    db: Session, 
    module_id: int, 
    level_id: Optional[int] = None, 
    section_id: Optional[int] = None, 
    group_id: Optional[int] = None
):
    query = db.query(CourseMaterial).filter(CourseMaterial.module_id == module_id)
    
    # If parameters are provided (e.g., student fetching), filter by target
    if level_id or section_id or group_id:
        conditions = [
            CourseMaterial.level_id == None,
            CourseMaterial.section_id == None,
            CourseMaterial.group_id == None
        ]
        if level_id:
            conditions.append(CourseMaterial.level_id == level_id)
        if section_id:
            conditions.append(CourseMaterial.section_id == section_id)
        if group_id:
            conditions.append(CourseMaterial.group_id == group_id)
            
        query = query.filter(or_(*conditions))

    return query.all()

def delete_course_material(db: Session, material_id: int, teacher_id: int):
    db_material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id, CourseMaterial.teacher_id == teacher_id).first()
    if db_material:
        db.delete(db_material)
        db.commit()
    return db_material


def create_exam_draft(db: Session, draft: ExamDraftCreate, teacher_id: int, file_url: str):
    db_draft = ExamDraft(
        title=draft.title,
        module_id=draft.module_id,
        teacher_id=teacher_id,
        file_url=file_url
    )
    db.add(db_draft)
    db.commit()
    db.refresh(db_draft)
    return db_draft

def get_teacher_exam_drafts(db: Session, teacher_id: int):
    return db.query(ExamDraft).filter(ExamDraft.teacher_id == teacher_id).all()

def get_pending_exam_drafts(db: Session):
    return db.query(ExamDraft).filter(ExamDraft.status == ExamDraftStatus.SUBMITTED).all()

def get_all_exam_drafts(db: Session):
    return db.query(ExamDraft).all()

def get_exam_draft(db: Session, draft_id: int):
    return db.query(ExamDraft).filter(ExamDraft.id == draft_id).first()

def review_exam_draft(db: Session, draft_id: int, review: ExamDraftReview):
    db_draft = db.query(ExamDraft).filter(ExamDraft.id == draft_id).first()
    if db_draft:
        db_draft.status = review.status
        if review.admin_feedback is not None:
            db_draft.admin_feedback = review.admin_feedback
        db.commit()
        db.refresh(db_draft)
    return db_draft
