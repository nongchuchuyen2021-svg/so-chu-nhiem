from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", env_prefix="SCN_", extra="ignore")

    database_url: str = f"sqlite:///{(ROOT / 'data' / 'so_chu_nhiem.db').as_posix()}"
    backup_dir: Path = ROOT / "data" / "backups"
    backup_keep: int = 30
    # BẮT BUỘC đổi khi triển khai thật (đặt SCN_SECRET_KEY trong .env)
    secret_key: str = "dev-only-change-me"
    token_hours: int = 12
    cookie_secure: bool = False  # đặt True khi chạy qua HTTPS
    max_login_fails: int = 5
    lockout_minutes: int = 10


settings = Settings()
