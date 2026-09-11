import os
import uuid
from typing import Tuple
from PIL import Image
from io import BytesIO


def ensure_dirs(path: str):
    os.makedirs(path, exist_ok=True)


def save_image_bytes(data: bytes, upload_dir: str, original_filename: str = "wound.jpg") -> Tuple[str, str]:
    """
    Saves raw image bytes with a unique identifier to avoid naming collisions.
    Returns (local_file_path, relative_url).
    """
    ensure_dirs(upload_dir)
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    file_id = f"scan_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(upload_dir, file_id)

    with open(target_path, "wb") as f:
        f.write(data)

    relative_url = f"/uploads/{file_id}"
    return target_path, relative_url


def analyze_symptom_urgency(free_text: str) -> Tuple[float, str]:
    """
    Clinical heuristic NLP screener for patient-reported symptoms.
    Returns (urgency_score_0_to_1, triage_category).
    """
    text = free_text.lower()

    # Red flag emergency indicators
    emergency_keywords = [
        "fever", "chills", "foul", "pus", "purulent", "burst", "dehiscence",
        "opened", "profuse", "bleeding", "chest pain", "short of breath",
        "unbearable", "excruciating", "spreading redness", "heat", "hot to touch"
    ]
    for kw in emergency_keywords:
        if kw in text:
            return 0.85, "Critical / Infection Risk"

    # Moderate indicators
    moderate_keywords = [
        "nausea", "vomit", "dizzy", "swelling", "moderate pain", "drainage",
        "bruise", "tight", "burning", "discharge", "leak"
    ]
    for kw in moderate_keywords:
        if kw in text:
            return 0.50, "Moderate Post-Op Symptom"

    # Mild recovery sensations
    mild_keywords = [
        "itch", "itchy", "tingling", "pulling", "tired", "sore", "dry", "stiff"
    ]
    for kw in mild_keywords:
        if kw in text:
            return 0.20, "Expected Healing Sensation"

    return 0.15, "General Recovery Note"
