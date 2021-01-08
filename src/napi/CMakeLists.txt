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
if(UNIX AND NOT APPLE)
  set_target_properties(${PROJECT_NAME} PROPERTIES BUILD_WITH_INSTALL_RPATH TRUE)
  set_target_properties(${PROJECT_NAME} PROPERTIES INSTALL_RPATH "$ORIGIN")
endif()
if (APPLE)
  # Set rpath for directory portion of install_name field of shared libraries
  set(CMAKE_MACOSX_RPATH TRUE)
endif ()

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

if(UNIX AND NOT APPLE)
  file(GLOB SDK_DEPS "$ENV{BOTLINKSDK_DIR}/lib/*.so*")
  set(BINDINGS_OUTPUT_DIR ${CMAKE_BINARY_DIR}/$<CONFIG>)
elseif(APPLE)
  file(GLOB SDK_DEPS "$ENV{BOTLINKSDK_DIR}/lib/*.dylib*")
  set(BINDINGS_OUTPUT_DIR ${CMAKE_BINARY_DIR}/$<CONFIG>)
elseif(WIN32)
  file(GLOB SDK_DEPS "$ENV{BOTLINKSDK_DIR}/bin/*.dll")
  set(BINDINGS_OUTPUT_DIR ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/$<CONFIG>)
endif()

if (SDK_DEPS)
  add_custom_command(
    TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    ${SDK_DEPS}
    ${BINDINGS_OUTPUT_DIR}/)
endif()
