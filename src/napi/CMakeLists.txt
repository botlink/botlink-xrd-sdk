cmake_minimum_required (VERSION 3.10)
project (botlink-cxx-client-bindings)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_definitions(-DNAPI_VERSION=6)

file(GLOB SOURCE_FILES "src/*.cpp")
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

if(MSVC)
  target_compile_options(${PROJECT_NAME} PRIVATE /W4 /WX)
else()
  target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic -Werror)
endif()

target_include_directories(${PROJECT_NAME} PRIVATE
  ${CMAKE_JS_INC}
  $ENV{BOTLINKSDK_DIR}/include)

set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
set_target_properties(${PROJECT_NAME} PROPERTIES BUILD_WITH_INSTALL_RPATH TRUE)
# TODO(cgrahn): "$ORIGIN" is Linux specific
set_target_properties(${PROJECT_NAME} PROPERTIES INSTALL_RPATH "$ORIGIN")
target_link_directories(${PROJECT_NAME} PRIVATE
  $ENV{BOTLINKSDK_DIR}/lib)
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} botlink-cxx-client)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})

# TODO(cgrahn): Below is Linux-only, hard-coding path isn't great, but the
# variables the KVS project sets are in a different CMake scope.
file(GLOB SDK_DEPS "$ENV{BOTLINKSDK_DIR}/lib/*.so*")

add_custom_command(
        TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
                ${SDK_DEPS}
                ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}/)
