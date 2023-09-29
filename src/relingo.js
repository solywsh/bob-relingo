var config = require('./config.js');


const relingoUrl = "https://api.relingo.net"

// 获取验证码
async function authorization() {
    try {
        // $log.info('获取验证码', config.getConfig().mail);
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/authorization",
            body: {"email": $option.email},
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            }
        });
        // $log.info(JSON.stringify(resp.data));
        if (resp.data && resp.data.code === 0) {
            const userConfig = config.getConfig();
            userConfig.status = "waitingCode";
            userConfig.mailCodeSendAt = new Date().getTime();
            userConfig.mail = $option.email;
            config.updateConfig(userConfig);
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data.message) : '/api/authorization请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

// 验证码登录
async function loginByCode() {
    try {
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/loginByCode",
            body: {
                "email": $option.email,
                "code": $option.mailCode,
            },
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        // $log.info(JSON.stringify(resp.data));
        if (resp.data && resp.data.code === 0) {
            const userConfig = config.getConfig();
            userConfig.status = "active";
            userConfig.username = resp.data.data.name;
            userConfig.token = resp.data.data.token;
            userConfig.mailCode = $option.mailCode;
            userConfig.tokenUpdatedAt = new Date().getTime();
            userConfig.tokenExpireAt = resp.data.data.expiredAt;
            config.updateConfig(userConfig);
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data.message) : '\"/api/loginByCode\"请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

// 查询用户信息/刷新token
async function getUserInfo() {
    try {
        const userConfig = config.getConfig();
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/getUserInfo",
            body: {},
            header: {
                'x-relingo-lang': userConfig.lang,
                'x-relingo-token': userConfig.token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        $log.info(JSON.stringify(resp.data));
        if (resp.data && resp.data.code === 0) {
            userConfig.status = "active";
            userConfig.token = resp.data.data.token;
            userConfig.tokenUpdatedAt = new Date().getTime();
            config.updateConfig(userConfig);
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data.message) : '\"/api/getUserInfo\"请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            // userConfig.status = "error";
            // config.updateConfig(userConfig);
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}


// 获取用户配置
async function getUserConfig() {
    try {
        const userConfig = config.getConfig();
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/getUserConfig",
            body: {},
            header: {
                'x-relingo-lang': userConfig.lang,
                'x-relingo-token': userConfig.token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        if (resp.data && resp.data.code === 0) {
            config.updateRelingoConfig(JSON.stringify(resp.data.data.config));
            userConfig.books = [];
            // userConfig.native = resp.data.data.config.lang.native; // 翻译语言，鉴于relingo其他语言翻译不够完善，暂时不使用
            for (const book of resp.data.data.config.books) {
                if (book.name === "strange") {
                    userConfig.strange = book._id;
                    userConfig.books.push(book._id);
                    continue
                }
                if (book.name === "mastered") {
                    userConfig.mastered = book._id;
                    continue
                }
                if (book.active) {
                    userConfig.books.push(book.id);
                }
            }
            config.updateConfig(userConfig);
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data.message) : '\"/api/getUserConfig\"请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}


// 从单词本查询单词
async function parseContent3(to, words) {
    try {
        const userConfig = config.getConfig();
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/parseContent3",
            body: {
                "to": to,
                "words": [words],
                "vocabulary": userConfig.books,
                "definition": false,
            },
            header: {
                'x-relingo-lang': userConfig.lang,
                'x-relingo-token': userConfig.token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        // $log.info(JSON.stringify(resp.data));
        if (resp.data && resp.data.code === 0) {
            if (!resp.data.data.words || resp.data.data.words.length === 0) {
                const err = new Error();
                Object.assign(err, {
                    _type: 'notFound',
                    _message: '此单词未在relingo词本中收录',
                });
                throw err;
            }
            return resp.data.data.words[0];
        } else {
            const errMsg = resp.data.message ? JSON.stringify(resp.data.message) : '\"/api/parseContent3\"请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

async function lookupDict2(to, words) {
    try {
        const userConfig = config.getConfig();
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/lookupDict2",
            body: {
                "to": to,
                "words": [words],
            },
            header: {
                'x-relingo-lang': userConfig.lang,
                'x-relingo-token': userConfig.token,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        // $log.info(JSON.stringify(resp.data));
        if (resp.data && resp.data.code === 0) {
            if (!resp.data.data || resp.data.data.length === 0) {
                const err = new Error();
                Object.assign(err, {
                    _type: 'notFound',
                    _message: '此单词未在relingo词本中收录',
                });
                throw err;
            }
            return resp.data.data[0];
        } else {
            const errMsg = resp.data.message ? JSON.stringify(resp.data.message) : '\"/api/lookupDict2\"请求失败,请检查网络';
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: errMsg,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

exports.authorization = authorization;
exports.loginByCode = loginByCode;
exports.getUserInfo = getUserInfo;
exports.getUserConfig = getUserConfig;
exports.parseContent3 = parseContent3;
exports.lookupDict2 = lookupDict2;
