"use strict";
const https = require('https');
const fs = require('fs');
const path = require('path');
const process = require('process');
const gunzip = require('gunzip-maybe');
const tar = require('tar-fs');
function saveSdkPath(sdkPath) {
    const envFile = path.join(__dirname, '..', '.sdkpath');
    fs.writeFileSync(envFile, `BOTLINKSDK_DIR=${sdkPath}`);
}
const botlinkSdkDirEnv = process.env['BOTLINKSDK_DIR'];
if (botlinkSdkDirEnv) {
    console.log(`BOTLINKSDK_DIR is set to ${botlinkSdkDirEnv}.`);
    console.log(`Using the C++ SDK at this location instead of downloading the C++ SDK.`);
    saveSdkPath(botlinkSdkDirEnv);
    process.exit(0);
}
const cxxSdkVersion = process.env['BOTLINK_CXX_SDK_VERSION'];
if (!cxxSdkVersion) {
    console.error(`C++ SDK version is not set. Cannot download C++ SDK (dependency for rebuilding TypeScript SDK).`);
    process.exit(1);
}
if (!fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
    console.error(`Could not find package.json. Did you move this script?`);
    process.exit(1);
}
const tmpDir = path.join(__dirname, '..', 'tmp');
const cxxSdkInstallDir = path.join(tmpDir, 'botlink-cxx-sdk-v' + cxxSdkVersion);
if (fs.existsSync(cxxSdkInstallDir)) {
    console.log(`Botlink C++ SDK is already installed. See ${cxxSdkInstallDir}.`);
    saveSdkPath(cxxSdkInstallDir);
    process.exit(0);
}
try {
    fs.mkdirSync(path.join(tmpDir), true);
}
catch (error) {
    if (!fs.existsSync(tmpDir)) {
        console.error(`Failed to create temp directory for CXX SDK: ${error}`);
    }
}
function getSdkTarballName() {
    let platform = process.platform;
    if (platform == 'darwin') {
        platform = 'macos';
    }
    const arch = process.arch;
    return `botlink-cxx-sdk-${platform}-${arch}-v${cxxSdkVersion}.tar.gz`;
}
function downloadAndUnpackSdkTarball(filename) {
    console.log(`Downloading C++ SDK: ${filename}`);
    const file = fs.createWriteStream(path.join(tmpDir, filename));
    const url = `https://xrdtray.s3.amazonaws.com/botlink-cxx-client-libs/v${cxxSdkVersion}/${filename}`;
    try {
        const request = https.get(url, (response) => {
            response.pipe(file);
            response.on('end', () => {
                file.end();
                console.log(`Done downloading ${filename}.`);
                unpackTarball(tmpDir, filename);
                saveSdkPath(cxxSdkInstallDir);
            });
            response.on('error', (error) => {
                console.error(`Got error downloading ${filename}: ${error}`);
                process.exit(1);
            });
        });
    }
    catch (error) {
        console.error(`Failed to download ${filename}. Got error: ${error}.`);
    }
}
function unpackTarball(dir, file) {
    console.log(`Unpacking ${file}`);
    const tarball = fs.createReadStream(path.join(dir, file));
    tarball.on('error', (error) => {
        console.error(`Got error unpacking C++ SDK tarball: ${error}`);
        process.exit(1);
    });
    try {
        let unzipped = tarball.pipe(gunzip());
        unzipped.on('error', (error) => {
            console.error(`Got error unpacking C++ SDK tarball: ${error}`);
            process.exit(1);
        });
        let untarred = unzipped.pipe(tar.extract(dir));
        untarred.on('error', (error) => {
            console.error(`Got error unpacking C++ SDK tarball: ${error}`);
            process.exit(1);
        });
    }
    catch (error) {
        console.error(`Got error unpacking C++ SDK tarball: ${error}`);
        process.exit(1);
    }
    console.log('Done unpacking.');
}
downloadAndUnpackSdkTarball(getSdkTarballName());
