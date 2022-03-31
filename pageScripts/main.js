function extracted(pageScriptShowEventDispatched) {
    //显示H5报价工号ID
    let showH5ChannelIdOn = ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchShowH5ChannelIdOn
    let ShowH5Company_rules = ajax_interceptor_qoweifjqon.settings.ShowH5Company_rules
    if (!pageScriptShowEventDispatched && this.responseURL.indexOf('/icar/channel/queryProxyCompany') > -1) {
        let parse = JSON.parse(this.responseText);
        //显示工号ID
        if (showH5ChannelIdOn) {
            let deal_list = []
            parse.data.list.forEach(
                function (item) {
                    item.customName = item.channelId + '--' + item.customName
                    deal_list.push(item)
                })
            parse.data.list = deal_list
            this.responseText = JSON.stringify(parse)
            this.response = JSON.stringify(parse)
        }
        //过滤保司ID
        if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_ShowH5Company_rules_on && ShowH5Company_rules.length > 0) {
            let deal_list = []
            parse.data.list.forEach(
                function (item) {
                    for (const r in ShowH5Company_rules) {
                        if (item.id.toString() === ShowH5Company_rules[r].toString()) {
                            deal_list.push(item)
                        }
                    }
                })
            parse.data.list = deal_list
            this.responseText = JSON.stringify(parse)
            this.response = JSON.stringify(parse)

        }
        return !pageScriptShowEventDispatched
    }
}

// 命名空间
let ajax_interceptor_qoweifjqon = {
    settings: {
        ajaxInterceptor_switchOn: false,
        ajaxInterceptor_switchShowH5ChannelIdOn: false,
        ajaxInterceptor_rules: [],
        ShowH5Company_rules: [],
        ajaxInterceptor_ShowH5Company_rules_on: false,
        parent_href: false,
    },
    originalXHR: window.XMLHttpRequest,
    myXHR: function () {
        let pageScriptEventDispatched = false;
        let pageScriptShowEventDispatched = false;
        const modifyResponse = () => {
            // H5操作 1 显示工号 2 过滤保司
            pageScriptShowEventDispatched = extracted.call(this, pageScriptShowEventDispatched);
            ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.forEach(({
                                                                                    filterType = 'normal',
                                                                                    switchOn = true,
                                                                                    match,
                                                                                    overrideTxt = ''
                                                                                }) => {
                let matched = false;
                if (switchOn && match) {
                    if (filterType === 'normal' && this.responseURL.indexOf(match) > -1) {
                    // if (filterType === 'normal' && this.sourceRequestUrl.indexOf(match) > -1) {
                        matched = true;
                    } else if (filterType === 'regex' && this.responseURL.match(new RegExp(match, 'i'))) {
                        matched = true;
                    }
                }
                if (matched) {
                    this.responseText = overrideTxt;
                    this.response = overrideTxt;
                    if (!pageScriptEventDispatched) {
                        window.dispatchEvent(new CustomEvent("pageScript", {
                            detail: {url: this.responseURL, match}
                        }));
                        pageScriptEventDispatched = true;
                    }
                }
            })
        }
        const xhr = new ajax_interceptor_qoweifjqon.originalXHR;
        for (let attr in xhr) {
            if (attr === 'onreadystatechange') {
                xhr.onreadystatechange = (...args) => {
                    if (this.readyState === 4) {
                        // 请求成功
                        if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
                            // 开启拦截
                            modifyResponse();
                        }
                    }
                    this.onreadystatechange && this.onreadystatechange.apply(this, args);
                }
                continue;
            } else if (attr === 'onload') {
                xhr.onload = (...args) => {
                    // 请求成功
                    if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn) {
                        // 开启拦截
                        modifyResponse();
                    }
                    this.onload && this.onload.apply(this, args);
                }
                continue;
            } else if (attr === 'open') {
                if (xhr.open) {
                    this[attr] = function () {
                        const args = [].slice.call(arguments);
                        this['sourceRequestMethod'] = args[0]
                        this['sourceRequestUrl'] =args[1]
                        //TODO 可实现单一网站 不请求实际接口的拦截，但是结果不太理想
                        if ( args[1].indexOf('/policy/recentQuote') > -1 ){
                            // args[0] = 'OPTIONS'
                            // args[0] = 'GET'
                            // args[1] = 'http://ybinsure.com/t/oauth/channel/query-inner-code/test-01'
                            // args[1] = 'http://1.14.169.21:5099/api/channel/select_channel_company_list'
                        }
                        this.open && this.open.apply(xhr, args);

                    }
                }
                continue
            }
            else if (attr === 'send') {
                if (xhr.send) {
                    this[attr] = function () {
                        const args = [].slice.call(arguments)
                        this.send && this.send.apply(xhr, args);
                    }
                }
                continue
            }
            if (typeof xhr[attr] === 'function') {
                this[attr] = xhr[attr].bind(xhr)
                // this[attr] = function () {
                //     const args = [].slice.call(arguments)
                //     console.log(JSON.stringify(args))
                //     this[attr] && this[attr].apply(xhr, args);
                // }
            } else {
                // responseText和response不是writeable的，但拦截时需要修改它，所以修改就存储在this[`_${attr}`]上
                if (attr === 'responseText' || attr === 'response') {
                    Object.defineProperty(this, attr, {
                        get: () => this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`],
                        set: (val) => this[`_${attr}`] = val,
                        enumerable: true
                    });
                } else {
                    Object.defineProperty(this, attr, {
                        get: () => xhr[attr],
                        set: (val) => xhr[attr] = val,
                        enumerable: true
                    });
                }
            }
        }
    },

    originalFetch: window.fetch.bind(window),
    myFetch: function (...args) {
        return ajax_interceptor_qoweifjqon.originalFetch(...args).then((response) => {
            let txt = undefined;
            ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_rules.forEach(({
                                                                                    filterType = 'normal',
                                                                                    switchOn = true,
                                                                                    match,
                                                                                    overrideTxt = ''
                                                                                }) => {
                let matched = false;
                if (switchOn && match) {
                    if (filterType === 'normal' && response.url.indexOf(match) > -1) {
                        matched = true;
                    } else if (filterType === 'regex' && response.url.match(new RegExp(match, 'i'))) {
                        matched = true;
                    }
                }

                if (matched) {
                    window.dispatchEvent(new CustomEvent("pageScript", {
                        detail: {url: response.url, match}
                    }));
                    txt = overrideTxt;
                }
            });

            if (txt !== undefined) {
                const stream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(new TextEncoder().encode(txt));
                        controller.close();
                    }
                });

                const newResponse = new Response(stream, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                });
                const proxy = new Proxy(newResponse, {
                    get: function (target, name) {
                        switch (name) {
                            case 'ok':
                            case 'redirected':
                            case 'type':
                            case 'url':
                            case 'useFinalURL':
                            case 'body':
                            case 'bodyUsed':
                                return response[name];
                        }
                        return target[name];
                    }
                });

                for (let key in proxy) {
                    if (typeof proxy[key] === 'function') {
                        proxy[key] = proxy[key].bind(newResponse);
                    }
                }
                return proxy;
            } else {
                return response;
            }
        });
    },
}

window.addEventListener("message", function (event) {
    const data = event.data;
    if (data.type === 'ajaxInterceptor' && data.to === 'pageScript') {
        ajax_interceptor_qoweifjqon.settings[data.key] = data.value;
    }
    // http://1.14.169.21:57 页面不做处理，不知为啥 页面发起的请求没有onreadystatechange方法
    if (ajax_interceptor_qoweifjqon.settings.ajaxInterceptor_switchOn && !window.location.href.startsWith('http://1.14.169.21:57/')) {
        window.XMLHttpRequest = ajax_interceptor_qoweifjqon.myXHR;
        window.fetch = ajax_interceptor_qoweifjqon.myFetch;
    } else {
        window.XMLHttpRequest = ajax_interceptor_qoweifjqon.originalXHR;
        window.fetch = ajax_interceptor_qoweifjqon.originalFetch;
    }
}, false);