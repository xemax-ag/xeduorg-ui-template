from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
import sys
import platform

__cwd__ = str(Path(__file__).parents[1]).replace('\\', '/')
sys.path.append(__cwd__)

from core.toolbox.machine_os_type import get_computer_id, COMPUTER_IDS_DEV

system = platform.system()
if platform.system() == 'Windows':
    if get_computer_id() in COMPUTER_IDS_DEV:
        dotenv_path = Path(__file__).resolve().parents[2] / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[2] / 'xeduorg_ui_template.env'
elif system == 'Darwin':  # Mac Osx
    if get_computer_id() in COMPUTER_IDS_DEV:
        dotenv_path = Path(__file__).resolve().parents[2] / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[2] / 'xeduorg_ui_template.env'
elif system == 'Linux':
    if get_computer_id() in COMPUTER_IDS_DEV:
        dotenv_path = Path(__file__).resolve().parents[2] / 'config' / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[2] / 'config' / 'xeduorg_ui_template.env'

print('dotenv_path:', dotenv_path)
if not dotenv_path.exists():
    print(f'WARNING: dotenv file not found: {dotenv_path} -> config values stay empty', file=sys.stderr)
load_dotenv(dotenv_path=dotenv_path)


class Config(BaseSettings):
    # API
    api_base_url: str = ''
    auth_token: str = ''

    # DeepL
    deepl_auth_key: str = ''
    deepl_server_url: str = ''

config = Config()

if __name__ == '__main__':
    for item in config.__dict__.items():
        print(f'{item[0]}: {item[1]}')
