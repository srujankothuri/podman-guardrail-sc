from app.services.retrieval import ingest_document

sample_docs = [
    {
        "id": "leave_policy",
        "text": """Company Leave Policy:
Employees are entitled to 20 days of paid annual leave per year.
Sick leave is 10 days per year with a medical certificate required after 3 consecutive days.
Maternity leave is 16 weeks fully paid. Paternity leave is 2 weeks fully paid.
Leave requests must be submitted at least 2 weeks in advance through the HR portal.
Unused leave can be carried over for a maximum of 5 days to the next year.
Emergency leave of up to 3 days is available for immediate family bereavement."""
    },
    {
        "id": "work_hours",
        "text": """Work Hours and Flexibility Policy:
Standard work hours are 9am to 5pm Monday to Friday.
Flexible working hours are available with manager approval.
Remote work is allowed up to 3 days per week for eligible roles.
Overtime must be pre-approved by your manager and will be compensated.
Core hours where all employees must be available are 10am to 3pm."""
    },
    {
        "id": "benefits",
        "text": """Employee Benefits:
Health insurance covers employee and immediate family members.
401k matching up to 4% of salary.
Annual learning and development budget of $2000 per employee.
Gym membership reimbursement up to $50 per month.
Employee assistance program available 24/7 for mental health support."""
    }
]

for doc in sample_docs:
    success = ingest_document(doc["text"], doc["id"], {"source": doc["id"]})
    print(f"Ingested {doc['id']}: {success}")

print("Sample knowledge ingested!")
