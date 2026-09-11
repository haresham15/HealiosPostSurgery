from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlmodel import Session, select
from ..db import User, VitalSign, Medication, Observation
from ..schemas import CitationItem, AgentConsultResponse
from .vector_store import vector_store


class ClinicalAgent:
    """
    Multimodal clinical agent with EHR biometric tool execution and
    grounded ERAS protocol reasoning.
    """

    @staticmethod
    def tool_get_vitals(session: Session, user_id: int) -> Optional[VitalSign]:
        return session.exec(
            select(VitalSign)
            .where(VitalSign.user_id == user_id)
            .order_by(VitalSign.created_at.desc())
        ).first()

    @staticmethod
    def tool_get_latest_assessment(session: Session, user_id: int) -> Optional[Observation]:
        return session.exec(
            select(Observation)
            .where(Observation.user_id == user_id)
            .order_by(Observation.created_at.desc())
        ).first()

    @staticmethod
    def tool_get_medications(session: Session, user_id: int) -> List[Medication]:
        return session.exec(
            select(Medication).where(Medication.user_id == user_id)
        ).all()

    def consult(
        self,
        session: Session,
        user: User,
        query: str,
        include_biometrics: bool = True,
    ) -> AgentConsultResponse:
        """
        Executes diagnostic tool retrieval, fetches relevant clinical protocol,
        and generates an evidence-grounded response.
        """
        tools_executed: List[str] = []
        latest_vital: Optional[VitalSign] = None
        latest_wound: Optional[Observation] = None
        meds: List[Medication] = []

        if include_biometrics:
            latest_vital = self.tool_get_vitals(session, user.id)
            tools_executed.append("tool_get_vitals")

            latest_wound = self.tool_get_latest_assessment(session, user.id)
            tools_executed.append("tool_get_latest_assessment")

            meds = self.tool_get_medications(session, user.id)
            tools_executed.append("tool_get_medications")

        # Retrieve verified clinical protocols
        matched_protocols = vector_store.query(query, top_k=2)
        tools_executed.append("hybrid_vector_rag_query")

        citations: List[CitationItem] = []
        for p in matched_protocols:
            citations.append(
                CitationItem(
                    protocol_id=p["id"],
                    title=p["title"],
                    section=p["category"],
                    guideline=p["guideline"],
                )
            )

        # Cross-reference patient state against clinical red flags
        q_lower = query.lower()
        is_fever = bool(latest_vital and latest_vital.temperature > 100.4)
        is_tachycardia = bool(latest_vital and latest_vital.heart_rate > 100)
        is_high_pain = bool(latest_vital and latest_vital.pain_score >= 7)
        wound_critical = bool(latest_wound and latest_wound.status == "critical")

        red_flag_terms = ["fever", "pus", "foul", "burst", "bleeding", "severe pain", "unbearable", "chills", "redness spreading", "hot to touch"]
        user_mentions_red_flag = any(term in q_lower for term in red_flag_terms)

        urgency = "nominal"
        escalate = False

        if is_fever or wound_critical or (user_mentions_red_flag and (is_fever or is_tachycardia or is_high_pain)):
            urgency = "critical"
            escalate = True
        elif is_tachycardia or is_high_pain or user_mentions_red_flag or (latest_wound and latest_wound.status == "warning"):
            urgency = "warning"
            escalate = bool(is_high_pain or is_fever)

        # Formulate grounded clinical response
        response_parts = []

        if escalate:
            response_parts.append(
                f"🚨 **Clinical Alert for {user.display_name}:** Based on your reported symptoms and current biometric readings "
                f"(Temp: {latest_vital.temperature if latest_vital else 'N/A'}°F, Heart Rate: {latest_vital.heart_rate if latest_vital else 'N/A'} bpm), "
                "your symptoms indicate an acute clinical review is advised. Please contact your surgical clinic on-call team directly."
            )
        elif urgency == "warning":
            response_parts.append(
                f"⚠️ **Attention ({user.display_name}):** Your reported inquiry warrants active monitoring. "
                "Ensure you remain hydrated and log your vitals again in 2 hours."
            )
        else:
            response_parts.append(
                f"Hello {user.display_name}. Based on your postoperative recovery telemetry (Procedure: {user.procedure_name or 'General Surgery'}, "
                f"Wound Status: {latest_wound.status if latest_wound else 'Nominal'}):"
            )

        # Grounding content from retrieved protocols
        primary_protocol = matched_protocols[0] if matched_protocols else None
        if primary_protocol:
            response_parts.append(f"\n**{primary_protocol['title']} [{primary_protocol['id']}]:**")
            response_parts.append(primary_protocol["content"])

        # Medication adherence context if relevant
        if any(w in q_lower for w in ["med", "pill", "antibiotic", "tylenol", "pain", "dose"]):
            untaken = [m.name for m in meds if not m.is_taken]
            if untaken:
                response_parts.append(
                    f"\n**Medication Status:** You have doses pending today for: {', '.join(untaken)}. "
                    "Remember to adhere strictly to your prescribed dosing intervals and take antibiotics to completion."
                )

        if escalate:
            response_parts.append(
                f"\n**Immediate Next Steps:** Call {user.clinic_phone or '(555) 234-8901'} or proceed to urgent surgical triage if symptoms escalate."
            )

        final_text = "\n".join(response_parts)

        return AgentConsultResponse(
            response=final_text,
            urgency=urgency,
            escalate_to_surgeon=escalate,
            citations=citations,
            tools_executed=tools_executed,
            timestamp=datetime.now(timezone.utc),
        )


clinical_agent = ClinicalAgent()
