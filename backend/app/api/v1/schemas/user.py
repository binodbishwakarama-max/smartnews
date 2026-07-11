from pydantic import BaseModel, Field

class UserSignup(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Unique username containing only alphanumeric characters, underscores, and hyphens"
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        description="Plaintext password"
    )
