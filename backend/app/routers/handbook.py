"""Public redirects to public UNSW Handbook pages; no local detail pages."""
import logging
from typing import Literal

from fastapi import APIRouter, Path
from fastapi.responses import RedirectResponse

from app.services.handbook_links import HANDBOOK, resolve_handbook_url

router = APIRouter(prefix="/handbook", tags=["Handbook links"])
logger = logging.getLogger(__name__)


@router.get("/{kind}/{identifier}")
def handbook_redirect(
    kind: Literal["courses", "programs", "specialisations"],
    identifier: str = Path(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9-]+$"),
    level: Literal["undergraduate", "postgraduate"] | None = None,
):
    try:
        url = resolve_handbook_url(kind, identifier, level)
    except Exception:
        # A network/metadata failure must not falsely declare a year unavailable.
        logger.warning("Handbook link lookup failed for %s/%s", kind, identifier, exc_info=True)
        url = HANDBOOK
    return RedirectResponse(url, status_code=302, headers={"Cache-Control": "no-store"})
