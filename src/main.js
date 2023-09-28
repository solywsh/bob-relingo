var config = require('./config.js');
var utils = require('./utils.js');
var relingo = require('./relingo.js');
function supportLanguages() {
    return config.supportedLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
    // 翻译成功
    // completion({'result': result});

    // 翻译失败
    // completion({'error': error});
}

// 邮箱信息验证
function pluginValidate(completion) {
    (async () => {;
        if (($option.mail === "")) {
            completion({
                result: false,
                error: {
                    type: "secretKey",
                    message: "邮箱为空",
                    troubleshootingLink: config.helpUrl,
                }
            });
            return;
        }
        switch (config.getConfig().status ) {
            case "init":
                await relingo.authorization()
                completion({
                    result: false,
                    error: {
                        type: "secretKey",
                        message: "邮箱验证码已经发送，请将验证码填入邮箱验证码中",
                        troubleshootingLink: config.helpUrl,
                    }
                });
                return;
            case "waitingCode":
                if ($option.mailCode === "") {
                    completion({
                        result: false,
                        error: {
                            type: "secretKey",
                            message: "短信验证码为空",
                            troubleshootingLink: config.helpUrl,
                        }
                    });
                    return;
                }else {
                    await relingo.loginByCode()
                    completion({
                        result: true,
                    });
                    return;
                }
        }
    }) ().catch((err) => {
        completion({
            result: false,
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                troubleshootingLink: err._troubleshootingLink || config.helpUrl,
            }
        });
    });
}

