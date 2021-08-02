"""This module provides functions that are used by binding.gyp."""
import os
import platform


def get_sdklibdir():
    """Get the path of the lib directory in the C++ SDK.

    If the BOTLINKSDK_DIR environment variable is not set, this falls
    back to get the path from the '.sdkpath' in the top-level
    directory.

    """
    sdklibdir = os.getenv('BOTLINKSDK_DIR')
    if sdklibdir is None:
        # This script isn't in the same directory as '.sdkpath', but
        # it's run from the directory that contains .sdkpath.
        sdklibdir = _get_sdk_path_from_file('.sdkpath')

    sdklibdir = os.path.join(sdklibdir, 'lib')
    return sdklibdir


def get_sdkbindir():
    """Get the path of the bin directory in the C++ SDK."""
    sdklibdir = os.getenv('BOTLINKSDK_DIR')
    if sdklibdir is None:
        sdklibdir = _get_sdk_path_from_file('.sdkpath')

    sdklibdir = os.path.join(sdklibdir, 'bin')
    return sdklibdir


def get_sdkincludedir():
    """Get the path of the include directory in the C++ SDK."""
    sdklibdir = os.getenv('BOTLINKSDK_DIR')
    if sdklibdir is None:
        sdklibdir = _get_sdk_path_from_file('.sdkpath')

    sdklibdir = os.path.join(sdklibdir, 'include')
    return sdklibdir


def print_deps_to_copy():
    """Print shared libraries that need to be copied from the C++ SDK."""
    deps = []
    if platform.system() == 'Darwin':
        sdklibdir = get_sdklibdir()
        deps = ', '.join([os.path.join(sdklibdir, x)
                         for x in os.listdir(sdklibdir) if '.dylib' in x])
    elif platform.system() == 'Linux':
        sdklibdir = get_sdklibdir()
        deps = ', '.join([os.path.join(sdklibdir, x)
                         for x in os.listdir(sdklibdir) if '.so' in x])
    elif platform.system() == 'Windows':
        sdkbindir = get_sdkbindir()
        deps = [os.path.join(sdkbindir, 'botlink-cxx-client.dll'),
                os.path.join(sdkbindir, 'libcrypto-1_1-x64.dll'),
                os.path.join(sdkbindir, 'libssl-1_1-x64.dll')]
        deps = ', '.join(deps)
    else:
        raise Exception('Unsupported platform')

    print(deps)


def _get_sdk_path_from_file(file_):
    sdk_path = ''
    with open(file_, 'r') as f:
        sdk_path = f.readlines()[0]
    sdk_path = sdk_path.split('=')[1]
    return sdk_path
