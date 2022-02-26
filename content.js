// const elt = document.createElement("script");
// elt.innerHTML = "window.test = 1"
// document.head.appendChild(elt);

// 在页面上插入代码
// const s1 = document.createElement('script');
// s1.setAttribute('type', 'text/javascript');
// s1.setAttribute('src', chrome.extension.getURL('pageScripts/defaultSettings.js'));
// document.documentElement.appendChild(s1);

// 在页面上插入代码
const script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.extension.getURL('pageScripts/main.js'));
document.documentElement.appendChild(script);

script.addEventListener('load', () => {
    const fields = ['ajaxInterceptor_switchOn', 'ajaxInterceptor_switchShowH5ChannelIdOn', 'ajaxInterceptor_rules', 'ShowH5Company_rules', 'ajaxInterceptor_ShowH5Company_rules_on']
    chrome.storage.local.set({'parent_href': window.location.href})
    chrome.storage.local.get(fields, (result) => {
        if (result.hasOwnProperty('ajaxInterceptor_switchOn')) {
            postMessage({
                type: 'ajaxInterceptor',
                to: 'pageScript',
                key: 'ajaxInterceptor_switchOn',
                value: result.ajaxInterceptor_switchOn
            });
        }
        if (result.ajaxInterceptor_rules) {
            postMessage({
                type: 'ajaxInterceptor',
                to: 'pageScript',
                key: 'ajaxInterceptor_rules',
                value: result.ajaxInterceptor_rules
            });
        }
        if (result.hasOwnProperty('ajaxInterceptor_switchShowH5ChannelIdOn')) {
            postMessage({
                type: 'ajaxInterceptor',
                to: 'pageScript',
                key: 'ajaxInterceptor_switchShowH5ChannelIdOn',
                value: result.ajaxInterceptor_switchShowH5ChannelIdOn
            });
        }
        if (result.ShowH5Company_rules) {
            postMessage({
                type: 'ajaxInterceptor',
                to: 'pageScript',
                key: 'ShowH5Company_rules',
                value: result.ShowH5Company_rules
            });
        }
        if (result.hasOwnProperty('ajaxInterceptor_ShowH5Company_rules_on')) {
            postMessage({
                type: 'ajaxInterceptor',
                to: 'pageScript',
                key: 'ajaxInterceptor_ShowH5Company_rules_on',
                value: result.ajaxInterceptor_ShowH5Company_rules_on
            });
        }
    });
});


let iframe;
let iframeLoaded = false;

// 只在最顶层页面嵌入iframe
if (window.self === window.top) {
    document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
            iframe = document.createElement('iframe');
            iframe.className = "api-interceptor";
            iframe.style.setProperty('height', '100%', 'important');
            iframe.style.setProperty('width', '600px', 'important');
            iframe.style.setProperty('min-width', '1px', 'important');
            iframe.style.setProperty('position', 'fixed', 'important');
            iframe.style.setProperty('top', '0', 'important');
            iframe.style.setProperty('right', '0', 'important');
            iframe.style.setProperty('left', 'auto', 'important');
            iframe.style.setProperty('bottom', 'auto', 'important');
            iframe.style.setProperty('z-index', '9999999999999', 'important');
            iframe.style.setProperty('transform', 'translateX(620px)', 'important');
            iframe.style.setProperty('transition', 'all .4s', 'important');
            iframe.style.setProperty('box-shadow', '0 0 15px 2px rgba(0,0,0,0.12)', 'important');
            iframe.frameBorder = "none";
            iframe.src = chrome.extension.getURL("iframe/index.html")
            document.body.appendChild(iframe);
            let show = false;

            chrome.runtime.onMessage.addListener((msg, sender) => {
                if (msg == 'toggle') {
                    show = !show;
                    iframe.style.setProperty('transform', show ? 'translateX(0)' : 'translateX(620px)', 'important');
                }

                return true;
            });
        }
    }
}


// 接收background.js传来的信息，转发给pageScript
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'ajaxInterceptor' && msg.to === 'content') {
        if (msg.hasOwnProperty('iframeScriptLoaded')) {
            if (msg.iframeScriptLoaded) iframeLoaded = true;
        } else {
            postMessage({...msg, to: 'pageScript'});
        }
    }
});


// 接收pageScript传来的信息，转发给iframe
window.addEventListener("pageScript", function (event) {
    if (iframeLoaded) {
        chrome.runtime.sendMessage({type: 'ajaxInterceptor', to: 'iframe', ...event.detail});
    } else {
        let count = 0;
        const checktLoadedInterval = setInterval(() => {
            if (iframeLoaded) {
                clearInterval(checktLoadedInterval);
                chrome.runtime.sendMessage({type: 'ajaxInterceptor', to: 'iframe', ...event.detail});
            }
            if (count++ > 500) {
                clearInterval(checktLoadedInterval);
            }
        }, 10);
    }
}, false);
//
//
// let flat = false
// window.addEventListener("message", function (event) {
//     if (flat) flat =!flat
//     console.log("测试发送")
//     // chrome.runtime.sendMessage({type: 'ajaxInterceptor', to: 'iframe', key: 'parent_href', value: window.location.href})
//     postMessage({type: 'ajaxInterceptor', to: 'iframe', key: 'parent_href', value: window.location.href});
// }, true);


// window.parent.postMessage({ type: "CONTENT", text: "Hello from the webpage!" }, "*");


// var s = document.createElement('script');
// s.setAttribute('type', 'text/javascript');
// s.innerText = `console.log('test')`;
// document.documentElement.appendChild(s);

