from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.schemas import AnalysisResponse
from app.services.scoring import update_user_scores

app = FastAPI(title="LinguaEar Analytics Engine")

# App start hote hi Neon database mein tables create kar dega (agar nahi bani hongi toh)
Base.metadata.create_all(bind=engine)

@app.post("/analyze/{user_id}")
def analyze_user_input(user_id: str, payload: AnalysisResponse, db: Session = Depends(get_db)):
    # 1. Scoring service ko call karo jo errors save karegi aur scores update karegi
    update_user_scores(user_id=user_id, new_errors=payload.errors, db=db)
    
    return {
        "status": "success",
        "message": "Analysis processed and skill scores updated successfully!",
        "transcription": payload.transcription,
        "feedback": payload.feedback
    }