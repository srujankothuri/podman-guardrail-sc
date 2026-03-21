from pydantic import BaseModel

class PromptRequest(BaseModel):
    prompt: str
    user_id: str = "anonymous"
