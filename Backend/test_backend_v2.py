import os
import sys
import io
import time
from PIL import Image
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
from app.explainer import generate_and_save_gradcam_overlay, generate_gradcam_heatmap
from app.tissue_analysis import analyze_tissue_morphology
from app.rag.vector_store import vector_store
from app.rag.clinical_agent import clinical_agent
from app.db import get_session, init_db, User
from sqlmodel import select
from app.main import app


def test_suite_v2():
    print("==================================================================")
    print("HEALIOS V2 CLINICAL INTELLIGENCE & MULTIMODAL VERIFICATION SUITE")
    print("==================================================================")
    init_db()

    # 1. Grad-CAM Explainable AI Unit Test
    print("\n[TEST 1] Testing Grad-CAM Heatmap Generation (XAI Saliency)...")
    test_img = Image.new("RGB", (224, 224), color=(210, 120, 110))
    img_byte_arr = io.BytesIO()
    test_img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()
    test_np = np.expand_dims(np.array(test_img, dtype=np.float32) / 255.0, axis=0)

    t0 = time.perf_counter()
    heatmap_2d = generate_gradcam_heatmap(None, test_np, pred_index=8)
    local_path, rel_url = generate_and_save_gradcam_overlay(
        None, img_bytes, test_np, upload_dir="app/uploads", pred_index=8
    )
    elapsed = (time.perf_counter() - t0) * 1000
    assert heatmap_2d is not None and heatmap_2d.shape == (224, 224)
    assert os.path.exists(local_path)
    assert rel_url.startswith("/uploads/")
    print(f"  -> Grad-CAM Saliency generated in {elapsed:.2f} ms (Heatmap 2D: {heatmap_2d.shape}, Saved: {rel_url})")

    # 2. Tissue Morphology Computer Vision Segmentation
    print("\n[TEST 2] Testing Computer Vision Tissue Morphology Analyzer...")
    t0 = time.perf_counter()
    metrics = analyze_tissue_morphology(img_bytes, risk_score=15, predicted_class="Surgical Wounds")
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"  -> Granulation: {metrics['granulation_percent']}%")
    print(f"  -> Slough:      {metrics['slough_percent']}%")
    print(f"  -> Necrosis:    {metrics['necrosis_percent']}%")
    print(f"  -> Erythema Idx:{metrics['erythema_index']} ({metrics['erythema_radius']})")
    assert "granulation_percent" in metrics
    assert "slough_percent" in metrics
    assert "necrosis_percent" in metrics
    assert metrics["granulation_percent"] >= 0 and metrics["granulation_percent"] <= 100
    print(f"  -> Tissue segmentation verified in {elapsed:.2f} ms.")

    # 3. Hybrid BM25 & Semantic Clinical Protocol Retrieval (RAG)
    print("\n[TEST 3] Testing Clinical ERAS Hybrid Protocol Retrieval...")
    query = "elevated temperature fever and purulent wound drain after appendectomy"
    t0 = time.perf_counter()
    retrieved = vector_store.query(query, top_k=2)
    elapsed = (time.perf_counter() - t0) * 1000
    assert len(retrieved) > 0, "Vector store returned no protocols"
    top_doc = retrieved[0]
    score = top_doc.get("relevance_score", 0.0)
    print(f"  -> Query: '{query}'")
    print(f"  -> Top Protocol Match: [{top_doc['id']}] {top_doc['title']} (Score: {score:.3f})")
    print(f"  -> Guideline: {top_doc['guideline'][:90]}...")
    assert "SSI" in top_doc["id"] or "ERAS" in top_doc["id"]
    print(f"  -> RAG Retrieval verified in {elapsed:.2f} ms.")

    # 4. Clinical Recovery Agent Execution & Diagnostic EHR Tools
    print("\n[TEST 4] Testing Agentic Clinical Workflow with EHR Tools...")
    session_gen = get_session()
    db_session = next(session_gen)

    user = db_session.exec(select(User).where(User.external_id == "pat-default")).first()
    if not user:
        user = User(external_id="pat-default", display_name="Elena Rostova", procedure_name="Laparoscopic Appendectomy")
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    t0 = time.perf_counter()
    consult_result = clinical_agent.consult(
        session=db_session,
        user=user,
        query="I have mild pain around my incision site and my temperature is 99.1 F. Is this normal?",
        include_biometrics=True
    )
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"  -> Tools Executed by Agent: {consult_result.tools_executed}")
    print(f"  -> Red Flag Urgency: {consult_result.urgency}")
    print(f"  -> Attending Physician Escalation: {consult_result.escalate_to_surgeon}")
    print(f"  -> Citations ({len(consult_result.citations)}): {[c.protocol_id for c in consult_result.citations]}")
    print(f"  -> Agent Clinical Directives: {consult_result.response[:120]}...")
    assert len(consult_result.tools_executed) > 0
    assert len(consult_result.citations) > 0
    assert consult_result.urgency in ("nominal", "warning", "critical")
    print(f"  -> Multi-turn Agent Workflow verified in {elapsed:.2f} ms.")

    # 5. Full FastAPI Integration Suite
    print("\n[TEST 5] Testing FastAPI Endpoints (/predict, /agent/consult, /users, /recovery_summary)...")
    with TestClient(app) as client:
        # GET /health
        res = client.get("/health")
        assert res.status_code == 200
        print("  -> GET /health: OK")

        # GET /users/pat-default
        res = client.get("/users/pat-default")
        assert res.status_code == 200
        user_data = res.json()
        print(f"  -> Patient Profile Verified: {user_data['display_name']} | Procedure: {user_data.get('procedure_name')}")

        # PATCH /users/pat-default
        res = client.patch("/users/pat-default", json={"display_name": "Elena Rostova", "procedure_name": "Laparoscopic Appendectomy"})
        assert res.status_code == 200
        print("  -> PATCH /users/pat-default: OK")

        # POST /predict with user_id and image
        res = client.post(
            "/predict?user_external_id=pat-default&save_to_history=true",
            files={"file": ("test_incision.jpg", img_bytes, "image/jpeg")}
        )
        assert res.status_code == 200, f"Predict failed: {res.text}"
        pred = res.json()
        print(f"  -> POST /predict: Class={pred['predicted_class']} | Heatmap URL={pred.get('heatmap_url')}")
        assert pred.get("heatmap_url") is not None, "Predict response missing heatmap_url"
        assert "granulation_percent" in pred["tissue_metrics"], "Missing granulation_percent"

        # POST /agent/consult
        res = client.post(
            "/agent/consult",
            json={
                "user_external_id": "pat-default",
                "query": "My incision is slightly red. Can I shower today?"
            }
        )
        assert res.status_code == 200, f"Agent consult failed: {res.text}"
        agent_res = res.json()
        print(f"  -> POST /agent/consult: OK (Executed: {agent_res['tools_executed']})")
        assert len(agent_res["citations"]) >= 1

        # GET /recovery-summary/pat-default
        res = client.get("/recovery-summary/pat-default")
        assert res.status_code == 200
        summary = res.json()
        print(f"  -> GET /recovery-summary: Post-Op Day {summary['days_post_op']} | Adherence: {summary['adherence_rate']}% | Risk: {summary['composite_risk_score']}/100")
        assert summary["days_post_op"] is not None

    print("\n==================================================================")
    print("ALL 5 V2 CLINICAL AI & FULL-STACK TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================================")


if __name__ == "__main__":
    test_suite_v2()
