from typing import List, Dict, Any

CLINICAL_PROTOCOLS: List[Dict[str, Any]] = [
    {
        "id": "ERAS-GEN-01",
        "title": "Postoperative Surgical Site Infection (SSI) Triage",
        "category": "Infection Control & Wound Care",
        "content": (
            "Surgical site infection surveillance guidelines: Mild periwound redness (< 3mm) "
            "during postoperative days 1-5 is a normal physiologic inflammatory reaction. "
            "Red-flag indicators requiring same-day surgical notification include: "
            "(1) Spreading erythema extending greater than 5 cm from incision margin, "
            "(2) Core body temperature exceeding 100.4°F (38.0°C) or persistent chills, "
            "(3) Purulent (thick, milky, cloudy yellow or green) drainage with foul odor, "
            "(4) Wound margin separation (dehiscence) or evisceration, "
            "(5) Escalating focal pain unresponsive to prescribed multimodal analgesia."
        ),
        "guideline": "Escalate to on-call surgical team if temperature > 100.4°F, spreading redness > 5cm, or purulent drainage occurs."
    },
    {
        "id": "ERAS-APP-02",
        "title": "Laparoscopic Appendectomy ERAS Recovery Pathway",
        "category": "Procedure Specific: Appendectomy",
        "content": (
            "Standard laparoscopic appendectomy recovery expectations: "
            "Post-op Days 1-3: Mild incisional soreness (expected pain score 2-4/10), shoulder pain from residual CO2 pneumoperitoneum. "
            "Post-op Days 4-7: Incision edges should be closed with Dermabond or absorbable subcuticular monocryl sutures intact. "
            "Showering is permitted after 48 hours; do not soak in tubs, pools, or hot tubs until 2 weeks post-op. "
            "Diet: Advance to regular low-fat diet as tolerated. "
            "Activity: Walking 3-4 times daily encouraged (target 4,000-6,000 steps). Avoid lifting objects heavier than 10 lbs for 2 weeks."
        ),
        "guideline": "Advance walking to 4,000+ steps; no lifting >10 lbs for 14 days; keep Dermabond dry; resume normal light activity."
    },
    {
        "id": "ERAS-MED-03",
        "title": "Postoperative Multimodal Analgesia & Antibiotic Adherence",
        "category": "Pharmacology & Medication Safety",
        "content": (
            "Enhanced Recovery After Surgery (ERAS) pain protocol prioritizes non-opioid multimodal analgesia: "
            "(1) Acetaminophen (Tylenol) 650mg - 1,000mg every 6-8 hours (maximum 3,000mg/24h). "
            "(2) NSAIDs (Ibuprofen / Celecoxib) as prescribed, always taken with food or milk to prevent gastritis. "
            "(3) Prophylactic or therapeutic oral antibiotics (e.g., Cephalexin, Augmentin): complete the entire prescribed course "
            "even if incision looks healed, to eradicate residual bacterial colonization. "
            "(4) Anticoagulant DVT prophylaxis (Enoxaparin / Lovenox): administer subcutaneous injections at least 2 inches away from umbilicus."
        ),
        "guideline": "Do not exceed 3,000mg acetaminophen daily; take oral antibiotics to full completion; notify team if severe nausea prevents oral intake."
    },
    {
        "id": "ERAS-VIT-04",
        "title": "Biometric Vital Signs Critical Thresholds in Acute Recovery",
        "category": "Physiological Monitoring",
        "content": (
            "Physiologic recovery parameter thresholds: "
            "Resting Heart Rate: Normal adult 60 - 95 bpm. Tachycardia (> 100 bpm) at rest warrants investigation for dehydration, pain, or early sepsis. "
            "Blood Pressure: Target systolic 100 - 135 mmHg, diastolic 60 - 85 mmHg. "
            "Oxygen Saturation (SpO2): Must remain >= 95% on room air. SpO2 < 92% requires immediate medical attention. "
            "Incision Thermal Differential: A local wound temperature greater than 1.5°F above contralateral baseline indicates active hyperemic tissue inflammation."
        ),
        "guideline": "Resting HR > 100 bpm, SpO2 < 95%, or temperature > 100.4°F indicates guarded or critical recovery state requiring prompt review."
    },
    {
        "id": "ERAS-WND-05",
        "title": "Wound Care, Dressing Changes & Tissue Margin Healing",
        "category": "Wound Care",
        "content": (
            "Wound assessment principles: "
            "Granulation tissue (bright, beefy red, moist) is the desired hallmark of proliferative healing. "
            "Slough (yellow, tan, stringy material) indicates delayed healing or biofilm accumulation. "
            "Dressings: Keep initial surgical dressing clean and dry for first 24-48 hours. If drainage strikes through dressing, reinforce with sterile gauze. "
            "Do not apply unprescribed antibiotic ointments (Neosporin/Bacitracin), hydrogen peroxide, or alcohol onto surgical incisions as they impair re-epithelialization."
        ),
        "guideline": "Protect wound margin; do not scrub incision; avoid unprescribed topical ointments or alcohol."
    },
]
