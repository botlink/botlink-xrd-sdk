# define NAPI_VERSION
add_definitions(-DNAPI_VERSION=6)

file(GLOB SOURCE_FILES "src/*.cpp")
add_library(${PROJECT_NAME}_node SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
target_include_directories(${PROJECT_NAME}_node PRIVATE
  ${CMAKE_JS_INC}
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/src/include/com/amazonaws/kinesis/video/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/src/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/open-source/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/jsoncpp/include/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/wfqueue/
  ${CMAKE_CURRENT_SOURCE_DIR}/../third_party/
  ${CMAKE_CURRENT_SOURCE_DIR}/../src/)



set_target_properties(${PROJECT_NAME}_node PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME}_node ${CMAKE_JS_LIB} kvsWebrtcClient sioclient_tls pthread jsoncpp test_amazon-no-tls)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME}_node PRIVATE ${NODE_ADDON_API_DIR})
