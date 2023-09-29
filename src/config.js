const configPath = "$sandbox/config.json";
const relingoConfigPath = "$sandbox/relingoConfig.json";

const defaultConfig = {
    "version": "0.0.1", // 配置版本号与插件版本区分
    "username": "", // 用户名
    "mail": "", // 邮箱
    "mailCode": "", // 邮箱验证码
    "mailCodeSendAt": 0, // 邮箱验证码发送时间
    "token": "", // token
    "tokenUpdatedAt": 0, // token更新时间new Date().getTime()
    "tokenExpireAt": 0, // token过期时间
    "status": "init", // 状态 init waitingCode active error
    "lang": "cn", // header请求头用，暂时不知道有什么用
    "native": "zh", // 目标翻译语言
    "strange": "", // 陌生单词本
    "mastered": "", // 掌握的单词本
    books: [], // relingo books
}

function updateConfig(config) {
    $file.write({
        data: $data.fromUTF8(JSON.stringify(config)),
        path: configPath,
    })
}

function updateRelingoConfig(config) {
    $file.write({
        data: $data.fromUTF8(config),
        path: relingoConfigPath,
    })
}

function getConfig() {
    configInit();
    const c = JSON.parse($file.read(configPath).toUTF8());
    if (c.vserion < defaultConfig.vserion) {
        $file.delete(configPath);
        configInit();
    }
    // $log.info(configData);
    return JSON.parse($file.read(configPath).toUTF8());
}
function configInit() {
    if ($file.exists(configPath) && !$file.isDirectory(configPath)) {
        // $log.info("config file exit / is not directory");
        return;
    }
    if ($file.exists(configPath) && $file.isDirectory(configPath)) {
        $file.delete(configPath);
    }
    // $log.info(JSON.stringify(defaultConfig));
    $file.write({
        data: $data.fromUTF8(JSON.stringify(defaultConfig)),
        path: configPath
    })
}

exports.configPath = configPath;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.updateRelingoConfig = updateRelingoConfig;
