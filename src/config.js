
const configPath = "$sandbox/config.json";
const HelpUrl = "https://github.com/solywsh/bob-relingo"

const supportedLanguages = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh-Hans'],
    ['zh-Hant', 'zh-Hant'],
    ['en', 'en'],
];

function getConfig() {
    configInit();
    var config = $file.read(configPath).toUTF8();
    $log.info(config);
    return JSON.parse(config);
}


const defaultConfig = {
    "username": "", // 用户名
    "mail": $option.email, // 邮箱
    "mailCode": "", // 邮箱验证码
    "mailCodeSendAt": 0, // 邮箱验证码发送时间
    "token": "", // token
    "tokenUpdatedAt": 0, // token更新时间new Date().getTime()
    "status": "init", // 状态 init waitingCode active error
    "lang": "cn", //
    "strange": "", // 陌生单词本
    "mastered": "", // 掌握的单词本
    books: [], // relingo books
}

function updateConfig(config) {
    $file.write({
        data: $data.fromUTF8(JSON.stringify(config)),
        path: config
    })
}

function configInit(){
    if ($file.exists(configPath) && !$file.isDirectory(configPath)) {
        $log.info("config file exit / is not directory");
        return;
    }
    $file.delete(configPath);

    $file.write({
        data: $data.fromUTF8(JSON.stringify(defaultConfig)),
        path: configPath
    })
}

exports.supportedLanguages = supportedLanguages;

exports.configPath = configPath;
exports.helpUrl = HelpUrl;

exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
