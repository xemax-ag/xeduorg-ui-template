import platform
from pathlib import Path


def get_computer_id() -> str:
    """Return the unique machine ID of the current computer.

    Windows: ``MachineGuid`` from ``HKLM\\SOFTWARE\\Microsoft\\Cryptography``.
    macOS: ``IOPlatformUUID`` from the I/O registry.
    Linux: contents of ``/etc/machine-id``.
    All are generated once at OS installation and stay stable across reboots.
    """
    try:
        system = platform.system()
        if system == 'Windows':
            import winreg

            with winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r'SOFTWARE\Microsoft\Cryptography',
                0,
                winreg.KEY_READ | winreg.KEY_WOW64_64KEY,
            ) as key:
                value, _ = winreg.QueryValueEx(key, 'MachineGuid')
            return value
        elif system == 'Darwin':  # Mac Osx
            import subprocess

            output = subprocess.check_output(
                ['ioreg', '-rd1', '-c', 'IOPlatformExpertDevice'], text=True
            )
            for line in output.splitlines():
                if 'IOPlatformUUID' in line:
                    return line.split('"')[-2]
            return 'unknown'
        elif system == 'Linux':
            return Path('/etc/machine-id').read_text().strip()
        return 'unknown'
    except Exception:
        return 'unknown'


COMPUTER_IDS_DEV = [
    '0743b50c-9115-490c-b105-877ba4f6a27c',  # PHE-WS-WIN
    '0d64b140f3d8478a814139bf2d79a0bb',  # PHE-WS-LINUX
]

if __name__ == '__main__':
    print(get_computer_id())
    print(get_computer_id() in COMPUTER_IDS_DEV)