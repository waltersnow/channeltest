from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import channels, mappings, transform
from .core.config import settings

app = FastAPI(
    title="支付渠道管理系统",
    description="支付渠道管理系统API文档",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(channels.router, prefix=settings.API_V1_STR)
app.include_router(mappings.router, prefix=settings.API_V1_STR)
app.include_router(transform.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Payment Channel Management System"}
