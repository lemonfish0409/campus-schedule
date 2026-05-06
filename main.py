import os
import json

# Ensure the working directory is the project root so relative paths resolve correctly,
# no matter where the process was started from.
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import tasks, courses, pages

init_db()

app = FastAPI(title="Campus Schedule")

app.include_router(pages.router)
app.include_router(tasks.router)
app.include_router(courses.router)

app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn

    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    uvicorn.run(
        "main:app",
        host=config.get("host", "0.0.0.0"),
        port=config.get("port", 8000),
        reload=True,
    )
