from fastapi import APIRouter, Depends
from app.ml.churn_model import TrainedChurnModel
from app.core.security import get_current_user, CurrentUserContext

router = APIRouter()
model = TrainedChurnModel()

@router.post("/predict-churn")
def predict_churn(customer_data: dict, current_user: CurrentUserContext = Depends(get_current_user)):
    return model.predict(customer_data)

@router.get("/model-metrics")
def get_metrics(current_user: CurrentUserContext = Depends(get_current_user)):
    return model.get_evaluation_metrics()
