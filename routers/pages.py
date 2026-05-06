import os
from jinja2 import Environment, FileSystemLoader
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from routers.courses import TIME_SLOTS

router = APIRouter(tags=["pages"])

_tpl_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates")
_jinja_env = Environment(loader=FileSystemLoader(_tpl_dir), autoescape=True, cache_size=0)
templates = Jinja2Templates(env=_jinja_env)


@router.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "schedule.html")


@router.get("/schedule")
def schedule_page(request: Request):
    return templates.TemplateResponse(request, "schedule.html")


@router.get("/courses")
def courses_page(request: Request):
    return templates.TemplateResponse(request, "courses.html", {"time_slots": TIME_SLOTS})
