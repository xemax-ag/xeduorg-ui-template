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
        dotenv_path = Path(__file__).resolve().parents[1] / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[1] / 'xeduorg_ui_template.env'
elif system == 'Darwin':  # Mac Osx
    if get_computer_id() in COMPUTER_IDS_DEV:
        dotenv_path = Path(__file__).resolve().parents[1] / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[1] / 'xeduorg_ui_template.env'
elif system == 'Linux':
    if get_computer_id() in COMPUTER_IDS_DEV:
        dotenv_path = Path(__file__).resolve().parents[2] / 'config' / 'xeduorg_ui_template_dev.env'
    else:
        dotenv_path = Path(__file__).resolve().parents[2] / 'config' / 'xeduorg_ui_template.env'

print('dotenv_path:', dotenv_path)
load_dotenv(dotenv_path=dotenv_path)


class Config(BaseSettings):
    api_base_url: str = ''
    auth_token: str = ''

config = Config()

if __name__ == '__main__':
    for item in config.__dict__.items():
        print(f'{item[0]}: {item[1]}')
