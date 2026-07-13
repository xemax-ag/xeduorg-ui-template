import ast
import os
import pathlib
import re
import subprocess
import sys
import platform
import sysconfig
from pathlib import Path
import httpx
from datamodel_code_generator import Formatter

sys.path.append(str(pathlib.Path(__file__).parents[2]))

from core.config import config

formatters=[Formatter.RUFF_FORMAT, Formatter.RUFF_CHECK]

# https://datamodel-code-generator.koxudaxi.dev/cli-reference/openapi-only-options/#include-path-parameters


def env_with_script_dirs() -> dict[str, str]:
    """datamodel-codegen locates ruff via PATH; pip's script dirs (venv or user
    install) are not necessarily on it — prepend them for the subprocess."""
    env = os.environ.copy()
    scripts = (sysconfig.get_path('scripts'), sysconfig.get_path('scripts', f'{os.name}_user'))
    env['PATH'] = os.pathsep.join((*scripts, env.get('PATH', '')))
    return env


def download_openapi_json() -> None:
    with httpx.Client(timeout=60.0, follow_redirects=False) as client:
        url = f'{config.api_base_url}/openapi.json'
        print(config.api_base_url)
        response = client.get(url=url, headers={'Accept': 'application/json'}, timeout=60.0)
        response.raise_for_status()
    (Path(__file__).parents[2] / 'app' / 'openapi.json').write_bytes(response.content)


def fix_enum_defaults(file_path: Path) -> None:
    source = file_path.read_text()
    tree = ast.parse(source)

    enums: dict[str, dict[object, str]] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            base_names = {b.id for b in node.bases if isinstance(b, ast.Name)}
            if not base_names & {'Enum', 'StrEnum', 'IntEnum'}:
                continue
            members: dict[object, str] = {}
            for stmt in node.body:
                if (isinstance(stmt, ast.Assign)
                        and len(stmt.targets) == 1
                        and isinstance(stmt.targets[0], ast.Name)
                        and isinstance(stmt.value, ast.Constant)):
                    members[stmt.value.value] = stmt.targets[0].id
            if members:
                enums[node.name] = members

    if not enums:
        return

    new_source = source
    for enum_name, members in enums.items():
        for value, member_name in members.items():
            literal = repr(value) if not isinstance(value, str) else None
            if literal is None:
                pattern = rf'(:\s*{re.escape(enum_name)}(?:\s*\|\s*None)?\s*=\s*)["\']{re.escape(value)}["\']'
            else:
                pattern = rf'(:\s*{re.escape(enum_name)}(?:\s*\|\s*None)?\s*=\s*){re.escape(literal)}'
            new_source = re.sub(pattern, rf'\g<1>{enum_name}.{member_name}', new_source)

    if new_source != source:
        file_path.write_text(new_source)


def generate_models_openapi() -> None:
    output_path = Path(__file__).parents[0] / 'openapi.py'
    if platform.system() == 'Linux':
        cmd = ['uv', 'run', 'datamodel-codegen',
               '--input', str(Path(__file__).parents[2] / 'app' / 'openapi.json'), '--input-file-type', 'openapi',
               '--include-path-parameters', '--openapi-scopes', 'paths',
               '--output', str(output_path),
               '--formatters', 'ruff-format', '--formatters', 'ruff-check']
    else:
        cmd = [sys.executable, '-m', 'datamodel_code_generator',
               '--input', str(Path(__file__).parents[2] / 'app' / 'openapi.json'), '--input-file-type', 'openapi',
               '--include-path-parameters', '--openapi-scopes', 'paths',
               '--output', str(output_path),
               '--formatters', 'ruff-format', '--formatters', 'ruff-check']
    print(subprocess.list2cmdline(cmd))
    subprocess.run(cmd, check=True, env=env_with_script_dirs())
    fix_enum_defaults(output_path)


if __name__ == '__main__':
    download_openapi_json()
    # generate_models(scope='xyz')
    generate_models_openapi()