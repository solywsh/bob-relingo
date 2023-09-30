var config = require('./config.js');
var relingo = require('./relingo.js');
var words = require('./word.js');
var deepl = require('./deepl.js');

var items = [
    ['auto', 'auto'],
    ['zh-Hans', 'zh'], // 简体中文
    ['zh-Hant', 'zh'], // relingo不支持繁体中文，所以统一转换为简体中文
    ['en', 'en'], // 英语
    ['ja', 'ja'], // 日语
    ['ko', 'ko'], // 韩语
    ['fr', 'fr'], // 法语
    ['es', 'es'], // 西班牙语
    ['pt', 'pt'], // 葡萄牙语
    ['hi', 'hi'], // 印地语
    ['ru', 'ru'], // 俄语
    ['ar', 'ar'], // 阿拉伯语
    ['de', 'de'], // 德语

];
var langMap = new Map(items);
var langMapReverse = new Map(items.map(([standardLang, lang]) => [lang, standardLang]));

function supportLanguages() {
    return items.map(([standardLang, lang]) => standardLang);
}


function translate(query, completion) {
    (async () => {
        const sourceLanguage = langMap.get(query.detectFrom);
        const targetLanguage = langMap.get(query.detectTo);
        if (sourceLanguage !== 'en') {
            const err = new Error();
            Object.assign(err, {
                _type: 'unsupportLanguage',
                _message: 'relingo插件只支持翻译英文',
            });
            throw err;
        }
        if (targetLanguage === '') {
            const err = new Error();
            Object.assign(err, {
                _type: 'unsupportLanguage',
                _message: '不支持该语种',
            });
            throw err;
        }
        const userConfig = config.getConfig();
        const source_lang = sourceLanguage || 'en';
        const target_lang = targetLanguage || userConfig.native;
        const translate_text = query.text || '';
        if (translate_text !== '') {
            // 英文单词判定正则表达式
            if (/^[a-zA-Z,\.\?!'\s]+$/.test(translate_text)
                && translate_text.split(/\s+/).filter(word => /^[a-zA-Z\s]+$/.test(word)).length === 1){
                // 验证是否登录
                if ($option.email !== ""
                    && userConfig.token !== ""){
                    try {
                        await words.translate(query, source_lang, target_lang, translate_text, completion);
                    }catch (e) {
                        // relingo 未收录使用deepl翻译
                        if (e._type === 'notFound' ){
                            await deepl.translate(translate_text, sourceLanguage, targetLanguage, completion);
                        }else {
                            throw e;
                        }
                    }
                    return;
                }
            }
            // 默认deepL
            await deepl.translate(translate_text, sourceLanguage, targetLanguage , completion);
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误' + JSON.stringify(err),
            },
        });
    });
}

function pluginValidate(completion) {
    (async () => {
        if (!$option.email) {
            completion({
                result: false,
                error: {
                    type: "secretKey",
                    message: "邮箱不能为空",
                }
            });
            return;
        }
        switch (config.getConfig().status) {
            case "init":
                await relingo.authorization();
                completion({
                    result: false,
                    error: {
                        type: "secretKey",
                        message: "邮箱验证码已经发送，请将验证码填入邮箱验证码中",
                    }
                });
                return;
            case "waitingCode":
                if (!$option.mailCode) {
                    completion({
                        result: false,
                        error: {
                            type: "secretKey",
                            message: "短信验证码为空",
                        }
                    });
                    return;
                } else {
                    await relingo.loginByCode()
                    break;
                }
            case "active":
                await relingo.getUserInfo();
                await relingo.getUserConfig();
                break;
        }
        completion({
            result: true,
        });
    })().catch((err) => {
        completion({
            result: false,
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
            }
        });
    });
}

function pluginTimeoutInterval() {
    return 60;
}
