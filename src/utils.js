var config = require('./config.js');
var relingo = require('./relingo.js');
async function checkVocabulary(query,  completion) {
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

exports.checkVocabulary = checkVocabulary;
