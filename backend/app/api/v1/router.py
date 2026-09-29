from fastapi import APIRouter
from app.api.v1.endpoints import auth, universities, users, academic, communication, materials, exams, teacher, student

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(universities.router)
api_router.include_router(users.router)
api_router.include_router(academic.router)
api_router.include_router(communication.router, prefix="/communication", tags=["communication"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(exams.router, prefix="/exams", tags=["exams"])
api_router.include_router(teacher.router)
api_router.include_router(student.router, prefix="/student", tags=["student"])
