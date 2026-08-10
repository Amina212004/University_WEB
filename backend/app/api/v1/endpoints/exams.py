from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.content import ExamDraftStatus
from app.schemas.content import ExamDraftResponse, ExamDraftCreate, ExamDraftReview
from app.crud.content import (
    create_exam_draft, 
    get_teacher_exam_drafts, 
    get_pending_exam_drafts, 
    get_exam_draft, 
    review_exam_draft
)

router = APIRouter()

@router.post("/drafts", response_model=ExamDraftResponse)
async def submit_exam_draft(
    title: str = Form(...),
    module_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soumettre un brouillon de sujet d'examen (Enseignant uniquement).
    """
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Seuls les enseignants peuvent soumettre des examens.")

    # Save file locally
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"exam_{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    draft_data = ExamDraftCreate(title=title, module_id=module_id)
    
    draft = create_exam_draft(db=db, draft=draft_data, teacher_id=current_user.id, file_url=f"/uploads/{unique_filename}")
    return draft

@router.get("/drafts/me", response_model=List[ExamDraftResponse])
def get_my_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liste des sujets d'examen soumis par l'enseignant courant.
    """
    if current_user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Non autorisé.")
        
    return get_teacher_exam_drafts(db=db, teacher_id=current_user.id)

@router.get("/drafts/pending", response_model=List[ExamDraftResponse])
def get_pending_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    (Admin) Liste de tous les sujets d'examen en attente de validation.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent voir les sujets en attente.")
        
    return get_pending_exam_drafts(db=db)

@router.put("/drafts/{draft_id}/review", response_model=ExamDraftResponse)
def review_draft(
    draft_id: int,
    review: ExamDraftReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    (Admin) Approuver ou rejeter un sujet d'examen.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Seuls les administrateurs peuvent valider un examen.")
        
    draft = get_exam_draft(db=db, draft_id=draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Sujet introuvable.")
        
    updated_draft = review_exam_draft(db=db, draft_id=draft_id, review=review)
    return updated_draft
