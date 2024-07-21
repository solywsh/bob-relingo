var relingo = require('./relingo.js');
var config = require('./config.js');
var locales = require('./locales.js');
const {configPath} = require("./config");

// 单词翻译
async function translate(query, source_lang, target_lang, completion) {
    try {
        let data = {};
        const wordModel = $option.wordModel;
        const additionalDisplay = $option.additionalDisplay;
        if (wordModel==='1'){
            // 全词本查询
            data = await relingo.lookupDict2(target_lang, query.text);
        }else {
            // 个人词本查询
            data = await relingo.parseContent3(target_lang, query.text);
        }
        if (data) {
            const toDict = {
                word: query.text,
                phonetics: [], // 音标
                parts: [], // 词性
                exchanges: [],
                additions: []
            }
            if (data.phonetic.us){
                toDict.phonetics.push({
                    "type": "us",
                    "value": data.phonetic.us[0],
                    "tts": {
                        "type": "url",
                        "value": "https://dict.youdao.com/dictvoice?audio=" + query.text + '&type=2'
                    }
                })
            }
            if (data.phonetic.uk){
                toDict.phonetics.push({
                    "type": "uk",
                    "value": data.phonetic.uk[0],
                    "tts": {
                        "type": "url",
                        "value": "https://dict.youdao.com/dictvoice?audio=" + query.text + '&type=2'
                    }
                })
            }
            if (data.translations){
                // 创建一个对象来存储不同 "pos" 值对应的 "target" 值
                let posMap = {};
                data.translations.forEach((item)=>{
                    const pos = item.pos.toLowerCase();
                    const target = item.target;
                    // 如果 pos 在 posMap 中已存在，则将 target 添加到对应的 "means" 数组中
                    if (posMap[pos]) {
                        posMap[pos].means.push(target);
                    } else {
                        // 否则，创建一个新的对象并添加到 resultList 中
                        const newObj = {"part": pos, "means": [target]};
                        toDict.parts.push(newObj);
                        posMap[pos] = newObj;
                    }
                });
            }
            if ($option.variant === "1"
                && data.variant){
                for(const key in data.variant){
                    if (data.variant.hasOwnProperty(key)) {
                        /*"hosts": ["plural","thirdPersonSingular"],*/
                        let names = [];
                        data.variant[key].forEach((item)=>{
                            names.push(locales.getlocales(item,target_lang));
                        })
                        toDict.exchanges.push({"name":names.join(','),"words":[key]});
                    }
                }
            }
            if (additionalDisplay==='1'){
                let extraInfo = [];
                extraInfo.push("掌握情况: " + (data.mastered ? '✅' : '❌'));
                if (data.wordFrequency) {
                    extraInfo.push("词频: " + '🌟'.repeat(data.wordFrequency));
                }
                toDict.additions.push({
                    "name": "其他信息",
                    "value": extraInfo.join('\n'),
                })
            }
            // 更新词组，用作更新状态
            const userConfig = config.getConfig();
            userConfig.lastWords = data.word;
            config.updateConfig(userConfig);
            if (data.mastered){
                toDict.exchanges.push({"name":"修改状态","words":["忘记了"]});
            }else {
                toDict.exchanges.push({"name":"修改状态","words":["已掌握"]})
            }
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    // fromParagraphs: query.text.split('\n'),
                    toDict: toDict,
                }
            })
        } else {
            const errMsg = data.message ? JSON.stringify(data.message) : '请求翻译接口失败,请检查网络'
            completion({
                error: {
                    type: 'unknown',
                    message: errMsg,
                },
            });
        }
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e))
        Object.assign(e, {
            _type: e._type || 'unknown',
            _message: e._message || '未知错误' + JSON.stringify(e),
        });
        throw e;
    }
}

exports.translate = translate;
