var relingo = require('./relingo.js');
var locales = require('./locales.js');
async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        let data = {};
        const wordModel = $option.wordModel;
        const additionalDisplay = $option.additionalDisplay;
        if (wordModel==='1'){
            // 全词本查询
            data = await relingo.lookupDict2(target_lang, translate_text);
        }else {
            // 个人词本查询
            data = await relingo.parseContent3(target_lang, translate_text);
        }
        if (data) {
            const toDict = {
                word: translate_text,
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
                        "value": "https://dict.youdao.com/dictvoice?audio=" + translate_text + '&type=2'
                    }
                })
            }
            if (data.phonetic.uk){
                toDict.phonetics.push({
                    "type": "uk",
                    "value": data.phonetic.uk[0],
                    "tts": {
                        "type": "url",
                        "value": "https://dict.youdao.com/dictvoice?audio=" + translate_text + '&type=2'
                    }
                })
            }
            if (data.translations){
                /*"translations": [
                    {
                        "target": "主机",
                        "pos": "NOUN",
                        "score": 0.2101
                    },
                    {
                        "target": "宿主",
                        "pos": "NOUN",
                        "score": 0.1296
                    },
                    {
                        "target": "主持",
                        "pos": "VERB",
                        "score": 0.0526
                    }
                    ....
                ],*/

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
            if (data.variant && data.variant.length > 1){
                /*
                * "variant": {
                    "host": [
                        "singular"
                    ],
                    "hosts": [
                        "plural",
                        "thirdPersonSingular"
                    ],
                    "hosted": [
                        "pastTense",
                        "pastParticiple"
                    ],
                    "hosting": [
                        "presentParticiple"
                    ]
                },*/
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
                if (data.wordFrequency) {
                    toDict.additions.push({
                        "name": "词频",
                        "value": '🌟'.repeat(data.wordFrequency),
                    })
                }
                toDict.additions.push({
                    "name": "掌握情况",
                    "value": data.mastered ? '✅' : '❌',
                })
            }
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    fromParagraphs: translate_text.split('\n'),
                    // toParagraphs: toDict.parts[0].means.join('\n'),
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
            _type: e._type || 'network',
            _message: e._message || '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

exports.translate = translate;
