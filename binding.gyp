{
  "targets": [{
      "target_name": "botlink_xrd_sdk_bindings",
      "sources": ["src/napi/src/addon.cpp", "src/napi/src/botlink_api_wrapper.cpp",
                  "src/napi/src/logger_wrapper.cpp", "src/napi/src/video_forwarder.cpp",
                  "src/napi/src/xrdconnection_wrapper.cpp"],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "node_modules/node-addon-api",
        "<!@(python -c \"from scripts import find_sdk; print(find_sdk.get_sdkincludedir())\")"
      ],
      "defines": ["NAPI_CPP_EXCEPTIONS", "NAPI_VERSION=6"],
      'conditions': [
          ['OS=="linux"', {
              "cflags!": ["-fno-exceptions"],
              "cflags_cc!": ["-fno-exceptions"],
              "cflags_cc": ["-Wall", "-Wextra", "-pedantic", "-Werror", "-std=c++17"],
              "ldflags": ["-L<!@(python -c \"from scripts import find_sdk; print(find_sdk.get_sdklibdir())\")",
                          "-Wl,-rpath,'$$ORIGIN'"],
              "libraries": ["-lbotlink-cxx-client"],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["<!@(python -c \"from scripts import find_sdk; sdklibdir = find_sdk.print_deps_to_copy()\")"]
                    }
              ]
          }],
          ['OS=="mac"', {
              "xcode_settings": {"GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                                 "MACOSX_DEPLOYMENT_TARGET": "10.15",
                                 "OTHER_CFLAGS": ["-Wall", "-Wextra", "-pedantic", "-Werror", "-std=c++17"],
                                 "OTHER_LDFLAGS": ["-L<!@(python -c \"from scripts import find_sdk; print(find_sdk.get_sdklibdir())\")", "-Wl,-rpath,@loader_path"]},
              "libraries": ["-lbotlink-cxx-client"],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["<!@(python -c \"from scripts import find_sdk; sdklibdir = find_sdk.print_deps_to_copy()\")"]
                    }
              ]
          }],
          ['OS=="win"', {
	      "defines": [ "_HAS_EXCEPTIONS=1" ],
	      "msvs_settings": {
	          "VCCLCompilerTool": {
		      "AdditionalOptions": [ "-std:c++17", "/W4", "/WX" ],
		      "ExceptionHandling": "1"
		  },
		  "VCLinkerTool": {
		    "AdditionalLibraryDirectories": [ "<!@(python -c \"from scripts import find_sdk; print(find_sdk.get_sdklibdir())\")" ]
		  }
	      },
	      "libraries": [ "-lbotlink-cxx-client.lib", "-lWs2_32.lib" ],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["<!@(python -c \"from scripts import find_sdk; sdklibdir = find_sdk.print_deps_to_copy()\")"]
                    }
              ]
          }]
      ],
  },
  {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "destination": "<(module_path)",
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ]
        }
      ]
  }]
}
