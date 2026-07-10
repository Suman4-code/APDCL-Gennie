import random
import time
from typing import Dict, Any

def perform_ocr(file_bytes: bytes, file_name: str) -> Dict[str, Any]:
    """Simulates advanced optical character recognition (OCR) on uploaded files.
    Identifies if the document is a bill copy or meter image and extracts key fields.
    """
    time.sleep(1.5) # Simulate processing time
    
    file_name_lower = file_name.lower()
    
    # 1. Check if it appears to be a Meter Image
    if "meter" in file_name_lower or "mtr" in file_name_lower or "reading" in file_name_lower:
        reading = round(random.uniform(5000.0, 25000.0), 1)
        meter_no = f"APDCL{random.randint(100000, 999999)}"
        return {
            "document_type": "meter_reading",
            "extracted_data": {
                "meter_number": meter_no,
                "current_reading": f"{reading} kWh",
                "status": "Healthy / Normal",
                "tamper_status": "No Tampering Detected"
            },
            "bounding_boxes": [
                {"field": "meter_number", "box": [45, 120, 110, 30], "value": meter_no},
                {"field": "current_reading", "box": [120, 80, 140, 45], "value": f"{reading} kWh"}
            ],
            "message": "Meter image processed successfully. Reading extracted."
        }
        
    # 2. Default to Bill Document
    else:
        # Generate a random consumer number
        consumer_no = f"10{random.randint(100000000, 999999999)}"
        billing_amount = round(random.uniform(800.0, 3500.0), 2)
        due_date = "2026-07-20"
        
        return {
            "document_type": "electricity_bill",
            "extracted_data": {
                "consumer_number": consumer_no,
                "consumer_name": f"Consumer_{consumer_no[-4:]}",
                "bill_month": "June 2026",
                "amount_due": f"₹{billing_amount}",
                "due_date": due_date,
                "subdivision": "Kahilipara Subdivision"
            },
            "bounding_boxes": [
                {"field": "consumer_number", "box": [15, 45, 120, 25], "value": consumer_no},
                {"field": "amount_due", "box": [220, 190, 85, 30], "value": f"₹{billing_amount}"},
                {"field": "due_date", "box": [220, 230, 90, 25], "value": due_date}
            ],
            "message": "APDCL bill document parsed successfully. Outstanding billing fields mapped."
        }
