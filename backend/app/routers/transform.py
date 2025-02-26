from fastapi import APIRouter, HTTPException
from ..schemas.transform import TransformRequest, TransformResponse
from ..services.transform_service import TransformService

router = APIRouter(
    prefix="/transform",
    tags=["transform"]
)

@router.post("/test", response_model=TransformResponse)
def test_transform(request: TransformRequest):
    """
    测试转换规则
    """
    try:
        result = TransformService.test_transform(request.value, request.rule)
        return TransformResponse(
            original_value=request.value,
            transformed_value=result.value,
            rule=request.rule
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
