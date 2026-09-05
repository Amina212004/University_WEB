from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import uuid

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.content import MaterialType
from app.schemas.content import CourseMaterialResponse, CourseMaterialCreate
from app.crud.content import create_course_material, get_module_materials, delete_course_material

router = APIRouter()

@router.post("/upload", response_model=CourseMaterialResponse)
async def upload_material(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    material_type: MaterialType = Form(...),
    module_id: int = Form(...),
    level_id: Optional[int] = Form(None),
    section_id: Optional[int] = Form(None),
    group_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploader un fichier de cours (Seul le professeur peut le faire)
    """
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(status_code=403, detail="Seuls les enseignants peuvent publier des cours.")

    # Save file locally
    os.makedirs("uploads", exist_ok=True)
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join("uploads", unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    material_data = CourseMaterialCreate(
        title=title,
        description=description,
        material_type=material_type,
        module_id=module_id,
        level_id=level_id,
        section_id=section_id,
        group_id=group_id
    )
    
    material = create_course_material(db=db, material=material_data, teacher_id=current_user.id, file_url=f"/uploads/{unique_filename}")
    return material

@router.get("/module/{module_id}", response_model=List[CourseMaterialResponse])
def get_materials_by_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer les supports d'un module
    """
    # Note: On a real app we'd fetch the student's level/section/group to filter properly.
    # For now, we fetch all materials for the module, or apply filter if we know the user.
    if current_user.role == UserRole.STUDENT:
        # TODO: Get student enrollments to filter correctly. Right now, returning all for the module (simpler)
        materials = get_module_materials(db=db, module_id=module_id)
    else:
        # Teacher or Admin can see all
        materials = get_module_materials(db=db, module_id=module_id)
        
    return materials

@router.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Supprimer un document (Seul le prof propriétaire ou l'admin)
    """
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Non autorisé.")
        
    material = delete_course_material(db=db, material_id=material_id, teacher_id=current_user.id)
    if not material:
        raise HTTPException(status_code=404, detail="Document introuvable ou non autorisé.")
    return {"status": "success", "message": "Document supprimé."}
