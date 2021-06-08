{
  "targets": [{
      "target_name": "botlink_xrd_sdk_bindings",
      "sources": ["src/napi/src/addon.cpp", "src/napi/src/botlink_api_wrapper.cpp",
                  "src/napi/src/logger_wrapper.cpp", "src/napi/src/video_forwarder.cpp",
                  "src/napi/src/xrdconnection_wrapper.cpp"],
      "include_dirs": [
        "<!(node -e \"require('node-addon-api').include\")",
        "node_modules/node-addon-api",
        "$(BOTLINKSDK_DIR)/include"
      ],
      "defines": ["NAPI_CPP_EXCEPTIONS", "NAPI_VERSION=<(napi_build_version)"],
      'conditions': [
          ['OS=="linux"', {
              "cflags!": ["-fno-exceptions"],
              "cflags_cc!": ["-fno-exceptions"],
              "cflags_cc": ["-Wall", "-Wextra", "-pedantic", "-Werror", "-std=c++17"],
              "ldflags": ["-L<!(echo $BOTLINKSDK_DIR)/lib",
                          "-Wl,-rpath,'$$ORIGIN'"],
              "libraries": ["-lbotlink-cxx-client"],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["<!@(python -c \"import os; sdklibdir = os.getenv('BOTLINKSDK_DIR'); sdklibdir = os.path.join(sdklibdir, 'lib'); print(' '.join([os.path.join(sdklibdir, '%s') % x for x in os.listdir(sdklibdir) if '.so' in x]))\")"]
                    }
              ]
          }],
          ['OS=="mac"', {
              "xcode_settings": {"GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                                 "MACOSX_DEPLOYMENT_TARGET": "10.15",
                                 "OTHER_CFLAGS": ["-Wall", "-Wextra", "-pedantic", "-Werror", "-std=c++17"],
                                 "OTHER_LDFLAGS": ["-L<!(echo $BOTLINKSDK_DIR)/lib", "-Wl,-rpath,@loader_path"]},
              "libraries": ["-lbotlink-cxx-client"],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["<!@(python -c \"import os; sdklibdir = os.getenv('BOTLINKSDK_DIR'); sdklibdir = os.path.join(sdklibdir, 'lib'); print(' '.join([os.path.join(sdklibdir, '%s') % x for x in os.listdir(sdklibdir) if '.dylib' in x]))\")"]
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
		    "AdditionalLibraryDirectories": [ "$(BOTLINKSDK_DIR)/lib" ]
		  }
	      },
	      "libraries": [ "-lbotlink-cxx-client.lib", "-lWs2_32.lib" ],
              "copies":[
                    {
                        'destination': '<(module_path)',
                        'files': ["$(BOTLINKSDK_DIR)/bin/botlink-cxx-client.dll", "$(BOTLINKSDK_DIR)/bin/libcrypto-1_1-x64.dll", "$(BOTLINKSDK_DIR)/bin/libssl-1_1-x64.dll"]
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
