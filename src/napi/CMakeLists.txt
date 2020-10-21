# define NAPI_VERSION
add_definitions(-DNAPI_VERSION=6)

file(GLOB SOURCE_FILES "src/*.cpp")
add_library(${PROJECT_NAME}_node SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

if(MSVC)
  target_compile_options(${PROJECT_NAME}_node PRIVATE /W4 /WX)
else()
  target_compile_options(${PROJECT_NAME}_node PRIVATE -Wall -Wextra -pedantic -Werror)
endif()

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
set_target_properties(${PROJECT_NAME}_node PROPERTIES BUILD_WITH_INSTALL_RPATH TRUE)
# TODO(cgrahn): "$ORIGIN" is Linux specific
set_target_properties(${PROJECT_NAME}_node PROPERTIES INSTALL_RPATH "$ORIGIN")
target_link_libraries(${PROJECT_NAME}_node ${CMAKE_JS_LIB} botlink-wrtc)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME}_node PRIVATE ${NODE_ADDON_API_DIR})

# TODO(cgrahn): Below is Linux-only, hard-coding path isn't great, but the
# variables the KVS project sets are in a different CMake scope.
file(GLOB KVS_DEPS "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/amazon-kinesis-video-streams-webrtc-sdk-c/open-source/lib/*.so*")

add_custom_command(
        TARGET ${PROJECT_NAME}_node POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
                ${KVS_DEPS}
                ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}/)
