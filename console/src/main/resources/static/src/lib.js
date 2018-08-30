var hasAlert = false;

window.pageLanguage = aliwareIntl.currentLanguageCode;

window.edasprefix = 'acm'; //固定的edas网关需要的项目名

window.globalConfig = {
    isParentEdas: function () {
        try {
            if (window.parent.location.host.indexOf('edas') !== -1) {
                return true;
            }
        } catch (error) { }
        return false;
    }
};

let metaData = {};
request({
    type: 'get',
    url: 'com.alibaba.nacos.service.getMetaData', //以 com.alibaba. 开头最终会转换为真正的url地址
    data: {},
    $data: {}, //替换{}中的内容
    async: false,
    success: res => {
        if (res.code === 200) {
            metaData = res.data;
        }
    }
});
request.middleWare(config => {
    let url = config.url;
    let tenant = window.nownamespace || getParams('namespace') || '';
    tenant = tenant === 'global' ? '' : tenant;
    let splitArr = url.split('?');
    if (splitArr.length > 1) {
        let params = splitArr[1];
        if (params.indexOf('dataId') !== -1) {
            url += '&tenant=' + tenant;
            config.url = url;
        }
    }

    let preSucess = config.success;
    let preErorr = config.error;

    config.success = function (res) {

        if (res.code === 'ConsoleNeedLogin' && window.location.host.indexOf('acm') !== -1) {
            window.location.reload();
        }
        //鉴权
        if (res.code && res.code === -403) {
            window.narutoEvent && window.narutoEvent.trigger("validate", {
                codeType: res.data.codeType,
                verifyDetail: res.data.verifyDetail,
                config: Object.assign({}, config, {
                    success: preSucess
                })
            });
            return;
        }
        if (res.code === 403 && !hasAlert) {
            hasAlert = true;
            Dialog.alert({
                language: window.pageLanguage || 'zh-cn',
                style: { width: 400 },
                content: res.message,
                onOk: () => {
                    hasAlert = false;
                },
                onCancel: () => {
                    hasAlert = false;
                },
                onClose: () => {
                    hasAlert = false;
                }
            });
            return;
        } else {
            typeof preSucess === "function" && preSucess(res);
        }
    };

    config.error = function (res) {
        if (res.status === 403 && !hasAlert) {
            hasAlert = true;

            Dialog.alert({
                language: window.pageLanguage || 'zh-cn',
                style: { width: 400 },
                content: window.aliwareIntl.get('com.alibaba.nacos.pubshow'), //'子账号没有权限，请联系主账号负责人RAM上授权',
                onOk: () => {
                    hasAlert = false;
                },
                onCancel: () => {
                    hasAlert = false;
                },
                onClose: () => {
                    hasAlert = false;
                }
            });
            return;
        } else {
            typeof preErorr === "function" && preErorr(res);
        }
    };

    return config;
});

/**
 * 配置 monaco
 */
window.require.config({ paths: { 'vs': '//midwayfe.oss-cn-shanghai.aliyuncs.com/monaco-editor/min/vs' } });
window.require.config({
    'vs/nls': {
        availableLanguages: {
            '*': 'zh-cn'
        }
    }
});

window.require(['vs/editor/editor.main'], () => {
    // Register a new language
    monaco.languages.register({ id: 'properties' });

    // Register a tokens provider for the language
    monaco.languages.setMonarchTokensProvider('properties', {
        tokenizer: {
            root: [[/^\#.*/, 'comment'], [/.*\=/, 'key'], [/^=.*/, 'value']]
        }
    });

    // Define a new theme that constains only rules that match this language
    monaco.editor.defineTheme('properties', {
        base: 'vs',
        inherit: false,
        rules: [{ token: 'key', foreground: '009968' }, { token: 'value', foreground: '009968' }, { token: 'comment', foreground: '666666' }]
    });

    // Register a completion item provider for the new language
    monaco.languages.registerCompletionItemProvider('properties', {
        provideCompletionItems: () => {
            return [{
                label: 'simpleText',
                kind: monaco.languages.CompletionItemKind.Text
            }, {
                label: 'testing',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: {
                    value: 'testing(${1:condition})'
                }
            }, {
                label: 'ifelse',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: {
                    value: ['if (${1:condition}) {', '\t$0', '} else {', '\t', '}'].join('\n')
                },
                documentation: 'If-Else Statement'
            }];
        }
    });
});

window.importEditor = callback => {
    window.require(['vs/editor/editor.main'], () => {
        callback && callback();
    });
};

//同步获取命名空间地址

window._getLink = function () {
    let _linkObj = {};
    request({
        url: "com.alibaba.nacos.service.getLinks",
        async: false,
        data: {},
        success: res => {
            if (res.code === 200) {
                _linkObj = res.data;
            }
        }
    });
    return function (linkName) {
        return _linkObj[linkName] || "";
    };
}(window);


window.addEventListener('resize', () => {
    try {

        if (this.timmer) {
            clearTimeout(this.timmer);
        }
        this.timmer = setTimeout(() => {
            let height = document.body.clientHeight;
            height = height > 800 ? height : 800;
            window.parent.adjustHeight && window.parent.adjustHeight(height);
        }, 500);
    } catch (e) {

    }
})
//判断是否是国际站国际用户
window.isIntel = function () {

    let host = location.host;
    if (host.indexOf('alibabacloud.com') !== -1) {
        return true;
    } else {
        return false;
    }

}