var config = require('./config.js');
var relingo = require('./relingo.js');
async function checkVocabulary(query, completion) {
    const userConfig = config.getConfig();
    if (query.text !== ''
        && userConfig.lastWords !== ''
        && userConfig.mail !== ''
        && userConfig.token !== '') {
        if (query.text === "已掌握") {
            await relingo.submitVocabulary(userConfig.lastWords);
            const lastWords = userConfig.lastWords;
            userConfig.lastWords = '';
            config.updateConfig(userConfig);
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: [lastWords + '已掌握'],
                },
            });
            return true;
        }
        if (query.text === "忘记了") {
            await relingo.removeVocabularyWords(userConfig.lastWords);
            const lastWords = userConfig.lastWords;
            userConfig.lastWords = '';
            config.updateConfig(userConfig);
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: [lastWords + '已添加到生词本'],
                }
            })
            return true;
        }
    }
    return false;
}

// 更新token和用户信息
// 24h = 86400000ms
async function updateTokenConfig(userConfig) {
    const now = new Date().getTime();
    if (now - userConfig.tokenUpdatedAt > 86400000) {
        await relingo.getUserInfo();
        await relingo.getUserConfig();
    }
}

// cip.cc 的ip检测
async function cipCc(query, completion) {
    try {
        if (query.length === 0 || query.length > 15) {
            return false;
        }
        const text = query.text.replaceAll(" ", ".");
        // $log.info('cipCc ==> ' + text)
        if (/^((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))$/g.test(text)) {
            const resp = await $http.request({
                method: "GET",
                url: "https://cip.cc/" + text,
                header: {
                    'User-Agent': 'curl/8.1.2'
                }
            });
            if (resp.data) {
                // $log.info('cipCc ==> ' + JSON.stringify(resp.data))
                completion({
                    result: {
                        // fromParagraphs: text, // bob 新版本更新后不可传，会提示插件未返回有效结果，应该是对该字段进行校验
                        toParagraphs: JSON.stringify(resp.data).replaceAll('"', '').replaceAll('\\n', '\n').replaceAll('\\t', '\t').split('\n'),
                    },
                });
                return true;
            } else {
                $log.info('接口请求错误 ==> ' + JSON.stringify(resp.data))
                return false;
            }
        }
        return false;
    } catch (e) {
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}


exports.checkVocabulary = checkVocabulary;
exports.updateTokenConfig = updateTokenConfig;
exports.cipCc = cipCc;
