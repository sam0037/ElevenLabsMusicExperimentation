"""
Loop generation API route
POST /api/loop/generate
"""

from fastapi import APIRouter, HTTPException, status

from app.core.logging_config import get_logger
from app.models.audio import ErrorResponse, LoopRequest, LoopResponse
from app.services.loop_service import LoopService

router = APIRouter(prefix="/loop", tags=["loop"])
logger = get_logger(__name__)

_service = LoopService()


@router.post(
    "/generate",
    response_model=LoopResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation or input error"},
        404: {"model": ErrorResponse, "description": "Input file not found"},
        500: {"model": ErrorResponse, "description": "Processing error"},
    },
    summary="Generate a looped track",
    description=(
        "Extends a base audio track to the requested duration by intelligently "
        "looping and crossfading musical phrases. Both input_path and output_path "
        "must be absolute paths on the local filesystem."
    ),
)
def generate_loop(request: LoopRequest) -> LoopResponse:
    logger.info(
        f"Loop request received: "
        f"input={request.input_path!r}  "
        f"output={request.output_path!r}  "
        f"bpm={request.bpm}  "
        f"target={request.target_length_secs}s"
    )

    try:
        return _service.generate(request)

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error during loop generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing error: {exc}",
        ) from exc
