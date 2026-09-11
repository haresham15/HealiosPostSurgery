import os
import sys
import io
import time
from PIL import Image
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app


def run_all_tests():
    print("==================================================")
    print("HEALIOS BACKEND DEEP VERIFICATION & ACCURACY SUITE")
    print("==================================================")

    with TestClient(app) as client:
        # 1. Health Check
        print("\n[1] Testing GET /health...")
        t0 = time.perf_counter()
        res = client.get("/health")
        latency = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print(f" -> Status: {data['status']}, Model Loaded: {data['model_loaded']} ({latency:.1f} ms)")
        assert data["status"] == "ok"
        assert data["model_loaded"] is True

        # 2. User Creation & Retrieval
        print("\n[2] Testing User Endpoints (/users)...")
        res = client.post("/users", json={"external_id": "test-patient-101", "display_name": "Marcus Vance"})
        assert res.status_code == 200, f"Create user failed: {res.text}"
        user_data = res.json()
        print(f" -> Created user: {user_data['display_name']} (ID: {user_data['id']}, ExtID: {user_data['external_id']})")
        assert user_data["display_name"] == "Marcus Vance"

        res = client.get("/users/test-patient-101")
        assert res.status_code == 200
        assert res.json()["external_id"] == "test-patient-101"

        res = client.patch("/users/test-patient-101", json={"display_name": "Marcus Vance, Sr."})
        assert res.status_code == 200
        assert res.json()["display_name"] == "Marcus Vance, Sr."
        print(" -> User PATCH verified successfully.")

        # 3. Model Prediction & Clinical Interpretation
        print("\n[3] Testing POST /predict (Threadpool AI Inference & Auto-Save)...")
        # Create a synthetic wound-like test image
        img = Image.new("RGB", (224, 224), color=(190, 140, 130))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG")
        img_bytes = img_byte_arr.getvalue()

        t0 = time.perf_counter()
        res = client.post(
            "/predict?user_external_id=test-patient-101&save_to_history=true",
            files={"file": ("test_wound.jpg", img_bytes, "image/jpeg")},
        )
        latency = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200, f"Predict failed: {res.text}"
        pred_data = res.json()
        print(f" -> Prediction Completed in {latency:.1f} ms!")
        print(f" -> Predicted Class: {pred_data['predicted_class']}")
        print(f" -> Confidence: {pred_data['confidence'] * 100:.1f}%")
        print(f" -> Risk Score: {pred_data['risk_score']}/100 ({pred_data['status']})")
        print(f" -> Saved Assessment ID: {pred_data['saved_assessment_id']}")
        print(f" -> Tissue Metrics: {pred_data['tissue_metrics']}")
        assert len(pred_data["predictions"]) == 10
        assert len(pred_data["class_probabilities"]) == 10
        assert pred_data["saved_assessment_id"] is not None

        # 4. Assessment History
        print("\n[4] Testing GET /assessments and /assessments/latest...")
        res = client.get("/assessments?external_id=test-patient-101")
        assert res.status_code == 200
        assessments = res.json()
        print(f" -> Found {len(assessments)} saved assessment(s) for patient.")
        assert len(assessments) >= 1

        res = client.get("/assessments/latest?external_id=test-patient-101")
        assert res.status_code == 200
        latest = res.json()
        assert latest is not None
        assert latest["id"] == pred_data["saved_assessment_id"]
        print(f" -> Latest assessment ID matches: {latest['id']}")

        # 5. Vitals Telemetry
        print("\n[5] Testing Vitals Endpoints (/vitals)...")
        res = client.post(
            "/vitals",
            json={
                "user_external_id": "test-patient-101",
                "heart_rate": 74,
                "blood_pressure_sys": 120,
                "blood_pressure_dia": 78,
                "temperature": 98.7,
                "oxygen_saturation": 99,
                "pain_score": 2,
                "notes": "Mild incision tightness",
            },
        )
        assert res.status_code == 200, f"Vitals creation failed: {res.text}"
        vital_res = res.json()
        print(f" -> Recorded vital ID {vital_res['id']}: HR={vital_res['heart_rate']} bpm, BP={vital_res['blood_pressure_sys']}/{vital_res['blood_pressure_dia']}")

        res = client.get("/vitals?external_id=test-patient-101")
        assert res.status_code == 200
        assert len(res.json()) >= 1
        print(" -> Vitals history verified.")

        # 6. Medications & Adherence
        print("\n[6] Testing Medications Endpoints (/medications)...")
        res = client.get("/medications?external_id=test-patient-101")
        assert res.status_code == 200
        meds = res.json()
        print(f" -> Retrieved {len(meds)} active prescription(s).")
        assert len(meds) > 0

        first_med = meds[0]
        initial_status = first_med["is_taken"]
        print(f" -> Toggling medication '{first_med['name']}' (current status: {initial_status})...")
        res = client.patch(f"/medications/{first_med['id']}/toggle")
        assert res.status_code == 200
        toggled_med = res.json()
        assert toggled_med["is_taken"] != initial_status
        print(f" -> Medication toggled to {toggled_med['is_taken']}.")

        # 7. Symptom Logging & NLP Triage
        print("\n[7] Testing Symptom Logging (/symptom-logs)...")
        res = client.post(
            "/symptom-logs",
            json={
                "user_external_id": "test-patient-101",
                "free_text": "I feel slight itching around the tape, but feeling much better.",
                "urgency": 0.0,
            },
        )
        assert res.status_code == 200
        mild_log = res.json()
        print(f" -> Log 1 Urgency: {mild_log['urgency']} (Category: {mild_log['category']})")
        assert mild_log["urgency"] <= 0.30

        res = client.post(
            "/symptom-logs",
            json={
                "user_external_id": "test-patient-101",
                "free_text": "High fever, chills, and yellowish pus leaking from incision site.",
                "urgency": 0.0,
            },
        )
        assert res.status_code == 200
        severe_log = res.json()
        print(f" -> Log 2 (Infection Indicator) Urgency: {severe_log['urgency']} (Category: {severe_log['category']})")
        assert severe_log["urgency"] >= 0.80

        # 8. Recovery Composite Summary
        print("\n[8] Testing Composite Recovery Summary (/recovery-summary/{external_id})...")
        t0 = time.perf_counter()
        res = client.get("/recovery-summary/test-patient-101")
        latency = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200, f"Summary failed: {res.text}"
        summary = res.json()
        print(f" -> Composite Summary Loaded in {latency:.1f} ms!")
        print(f" -> Patient: {summary['user']['display_name']}, Post-Op Day: {summary['days_post_op']}")
        print(f" -> Composite Risk Score: {summary['composite_risk_score']}/100")
        print(f" -> Medication Adherence: {summary['adherence_rate']}%")
        print(f" -> Escalation Needed: {summary['escalation_needed']}")
        assert summary["latest_assessment"] is not None
        assert summary["latest_vitals"] is not None

    print("\n==================================================")
    print("ALL 8 BACKEND TEST SUITES PASSED FLAWLESSLY! 100% OK")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
