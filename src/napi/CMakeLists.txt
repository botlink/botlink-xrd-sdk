# Based off CMakeLists.txt from botbox-zmq-io

cmake_minimum_required (VERSION 3.9)
project (botlink_wrtc_js)

set(CMAKE_EXPORT_COMPILE_COMMANDS 1)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -fPIC")

add_subdirectory (${CMAKE_CURRENT_SOURCE_DIR}/../ wrtc)

# define NAPI_VERSION
add_definitions(-DNAPI_VERSION=6)

file(GLOB SOURCE_FILES "src/*.cpp")
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
target_include_directories(${PROJECT_NAME} PRIVATE
  ${CMAKE_JS_INC}
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/src/include/com/amazonaws/kinesis/video/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/src/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/open-source/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/jsoncpp/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/wfqueue/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/
  ${CMAKE_CURRENT_SOURCE_DIR}/../src/)



set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} kvsWebrtcClient sioclient_tls pthread jsoncpp test_amazon-no-tls)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})

# cpr uses 2.8.7 as minimum version, so might as well here too
#cmake_minimum_required (VERSION 2.8.7)
#project (botlink_wrtc)

#set(CMAKE_EXPORT_COMPILE_COMMANDS 1)
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++17 -fPIC")
#
#add_custom_command(OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/third_party/jsoncpp/dist/jsoncpp.cpp
#                   COMMAND cd ${CMAKE_CURRENT_SOURCE_DIR}/third_party/jsoncpp/ && python amalgamate.py)
#
#add_library (jsoncpp
#  ${CMAKE_CURRENT_SOURCE_DIR}/third_party/jsoncpp/dist/jsoncpp.cpp)
#
##set(BUILD_STATIC_LIBS 1)
#
#add_subdirectory (third_party/amazon-kinesis-video-streams-webrtc-sdk-c)
#add_subdirectory (third_party/googletest)
#add_subdirectory (third_party/socket.io-client-cpp)
