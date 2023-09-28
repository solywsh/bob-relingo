const config = require('./config.js');
const relingoUrl = "https://api.relingo.net"

// 获取验证码
async function authorization() {
    try {
        const resp = await $http.request({
            method: "POST",
            url: relingoUrl + "/api/authorization",
            body: {"email": config.getConfig().mail},
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        if (resp.data && resp.data.code === 0) {
            const userConfig = config.getConfig();
            userConfig.status = "waitingCode";
            userConfig.mailCodeSendAt = new Date().getTime();
            config.updateConfig(config)
        } else {
            $log.error('接口请求错误 ==> ' + JSON.stringify(resp.data));
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: resp.data.message,
                _troubleshootingLink: config.helpUrl,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: 'network',
            _message: '接口请求错误 - ' + JSON.stringify(e),
            _troubleshootingLink: config.helpUrl,
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
                "email": $option.mail,
                "code": $option.mailCode,
            },
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });
        $log.info(resp.data);
        if (resp.data && resp.data.code === 0) {
            const userConfig = config.getConfig();
            userConfig.status = "active";
            userConfig.username = resp.data.data.name;
            userConfig.token = resp.data.data.token;
            userConfig.tokenUpdatedAt = new Date().getTime();
            config.updateConfig(userConfig);
        }else {
            $log.error('接口请求错误 ==> ' + JSON.stringify(resp.data));
            const err = new Error();
            Object.assign(err, {
                _type: 'api',
                _message: resp.data.message,
                _troubleshootingLink: config.helpUrl,
            });
            throw err;
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e));
        Object.assign(e, {
            _type: 'network',
            _message: '接口请求错误 - ' + JSON.stringify(e),
            _troubleshootingLink: config.helpUrl,
        });
        throw e;
    }
}

exports =  {
    authorization,
    loginByCode
}
