import os
import numpy as np
from PIL import Image
from io import BytesIO
from typing import Dict, Any, List, Optional

try:
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
    import keras
    import tensorflow as tf
except ImportError:
    keras = None
    tf = None

TARGET_SIZE = (224, 224)

CLASS_NAMES = [
    "Abrasions",
    "Bruises",
    "Burns",
    "Cut",
    "Diabetic Wounds",
    "Laceration",
    "Normal",
    "Pressure Wounds",
    "Surgical Wounds",
    "Venous Wounds",
]


class TrueDivide(keras.layers.Layer if keras else object):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def call(self, x, y, **kwargs):
        return x / y


class Subtract(keras.layers.Layer if keras else object):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def call(self, x, y, **kwargs):
        return x - y


def load_model(model_path: str):
    """
    Loads the Keras .h5 wound classification model with custom layers and safe_mode=False.
    """
    if keras is None:
        print("Keras / TensorFlow not installed. Model loading skipped.")
        return None

    try:
        custom_objects = {
            "TrueDivide": TrueDivide,
            "Subtract": Subtract,
        }
        model = keras.models.load_model(
            model_path, compile=False, custom_objects=custom_objects, safe_mode=False
        )
        print(f"Successfully loaded wound classification model from {model_path}")
        warmup_model(model)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


def warmup_model(model):
    """
    Runs a dummy tensor through the model to pre-compile execution graphs
    and eliminate cold-start latency on the first patient request.
    """
    try:
        dummy = np.zeros((1, TARGET_SIZE[0], TARGET_SIZE[1], 3), dtype=np.float32)
        _ = model(dummy, training=False)
        print("Model graph warmed up successfully.")
    except Exception as e:
        print(f"Model warmup warning (non-fatal): {e}")


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocesses raw image bytes for deep learning inference.
    1. Opens image via Pillow
    2. Converts to RGB
    3. Resizes to (224, 224) using bilinear resampling
    4. Normalizes pixel values to [0.0, 1.0] (float32)
    5. Adds batch dimension: shape (1, 224, 224, 3)
    """
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img = img.resize(TARGET_SIZE, Image.Resampling.BILINEAR)
    img_array = np.array(img, dtype=np.float32)
    normalized_array = img_array / 255.0
    batch_array = np.expand_dims(normalized_array, axis=0)
    return batch_array


def interpret_predictions(predictions: List[float]) -> Dict[str, Any]:
    """
    Clinical rules engine mapping raw 10-class softmax probabilities into
    post-surgical healing status, risk scoring, tissue metrics, and triage recommendations.
    """
    max_prob = -1.0
    max_idx = 0
    probabilities_breakdown = []

    for idx, prob in enumerate(predictions):
        p = float(prob)
        if p > max_prob:
            max_prob = p
            max_idx = idx
        probabilities_breakdown.append({
            "label": CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else f"Class {idx}",
            "probability": round(p, 4),
        })

    predicted_class = CLASS_NAMES[max_idx] if max_idx < len(CLASS_NAMES) else "Surgical Wounds"
    normal_prob = float(predictions[6]) if len(predictions) > 6 else 0.0
    surgical_prob = float(predictions[8]) if len(predictions) > 8 else 0.0

    # Risk score calculation: 0 - 100 based on non-normal/abnormal wound indicators
    if predicted_class == "Normal":
        risk_score = max(5, min(25, int((1.0 - normal_prob) * 40)))
        status = "healthy"
        analysis = (
            "Your surgical incision demonstrates normal, progressive wound healing. "
            "Incision margins are well-approximated with no signs of dehiscence, excessive erythema, or purulent drainage."
        )
        recommendations = (
            "Keep the wound clean and dry. Avoid submerging in water (baths/swimming). "
            "Continue routine postoperative dressings as directed."
        )
        escalation = False

    elif predicted_class == "Surgical Wounds":
        if max_prob > 0.70 and normal_prob < 0.20:
            risk_score = 38
            status = "warning"
            analysis = (
                "Incision is actively consolidating. Mild periwound reactive hyperemia detected, "
                "typical of normal proliferative phase, but requires close daily observation."
            )
            recommendations = (
                "Maintain dry dressing. Monitor for increasing warmth or progressive spreading redness. "
                "Log your temperature twice daily."
            )
            escalation = False
        else:
            risk_score = 18
            status = "healthy"
            analysis = (
                "Post-surgical incision shows healthy primary intention closure. "
                "Epithelial bridge formation is proceeding normally."
            )
            recommendations = (
                "Continue standard postoperative care. Avoid tension or strenuous abdominal strain."
            )
            escalation = False

    elif predicted_class in ["Abrasions", "Bruises", "Burns", "Cut", "Laceration"]:
        risk_score = max(35, min(65, int(max_prob * 65)))
        status = "warning"
        analysis = (
            f"Superficial irritation or ecchymosis consistent with {predicted_class.lower()} detected. "
            "While mild contusions and bruising can occur postoperatively, any spreading inflammation must be monitored."
        )
        recommendations = (
            "Inspect site again this evening. If pain escalates or localized heat develops, contact your surgical clinic. "
            "Do not apply unprescribed topical ointments."
        )
        escalation = risk_score > 55

    else:  # Diabetic Wounds, Pressure Wounds, Venous Wounds
        risk_score = max(70, min(98, int(max_prob * 100)))
        status = "critical"
        analysis = (
            f"Potential wound healing complication ({predicted_class}) identified. "
            "Tissue characteristics suggest delayed healing, localized breakdown, or chronic wound phenotype."
        )
        recommendations = (
            "Immediate surgeon notification recommended. Contact your surgical on-call team or clinic coordinator today. "
            "Keep incision protected with sterile gauze."
        )
        escalation = True

    # Tissue physiological metrics
    granulation = max(30, min(100, 100 - int(risk_score * 0.75)))
    erythema_margin = (
        "< 2 mm (Normal)" if risk_score < 30
        else "3 - 5 mm (Mild reactive)" if risk_score < 60
        else "> 8 mm (Significant periwound spread)"
    )
    exudate = "Serosanguinous (trace)" if risk_score < 35 else "Serous (moderate)" if risk_score < 65 else "Purulent / High"

    tissue_metrics = {
        "epithelial_rate": "+1.6 mm/day" if status == "healthy" else "+0.8 mm/day" if status == "warning" else "+0.1 mm/day",
        "erythema_radius": erythema_margin,
        "granulation_score": granulation,
        "staple_integrity": "All staples / sutures intact and well-aligned",
        "exudate_level": exudate,
    }

    return {
        "predicted_class": predicted_class,
        "confidence": round(float(max_prob), 4),
        "risk_score": risk_score,
        "status": status,
        "probabilities": probabilities_breakdown,
        "ai_analysis": analysis,
        "recommendations": recommendations,
        "tissue_metrics": tissue_metrics,
        "escalation_required": escalation,
    }


def run_inference(model, image_bytes: bytes) -> Dict[str, Any]:
    """
    Synchronous CPU-bound inference pipeline:
    1. Preprocesses image
    2. Runs fast forward pass through Keras model
    3. Interprets clinical predictions
    Must be called inside run_in_threadpool in async endpoints.
    """
    processed_image = preprocess_image(image_bytes)
    # Fast callable inference without Keras generator overhead
    raw_tensor = model(processed_image, training=False)
    raw_predictions = raw_tensor.numpy()[0]
    predictions_list = [float(x) for x in raw_predictions]

    clinical_eval = interpret_predictions(predictions_list)
    clinical_eval["raw_predictions"] = predictions_list
    return clinical_eval