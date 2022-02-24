import React from 'react';
import ReactDOM from 'react-dom';

import Main from './Main';
import request from "./request-utils";

const DEFAULT_SETTING = {
    ajaxInterceptor_switchOn: false,
    ajaxInterceptor_switchShowH5ChannelIdOn: false,
    ajaxInterceptor_rules: [],
    ShowH5Company_rules: [],
}

request({
    url: '/api/channel/select_channel_company_list',
    method: 'get',
}).then(function (res) {
    if (res['data'] !== undefined && res['data'] != null) {
        localStorage.setItem("companyDataW", JSON.stringify(res['data']))
    }
})


if (chrome.storage) {
    const fields = ['ajaxInterceptor_switchOn', 'ajaxInterceptor_switchShowH5ChannelIdOn', 'ajaxInterceptor_rules', 'ShowH5Company_rules']
    debugger
    chrome.storage.local.get(fields, (result) => {
        // if (result.ajaxInterceptor_switchOn) {
        //   this.set('ajaxInterceptor_switchOn', result.ajaxInterceptor_switchOn, false);
        // }
        // if (result.ajaxInterceptor_rules) {
        //   this.set('ajaxInterceptor_rules', result.ajaxInterceptor_rules, false);
        // }
        window.setting = {
            ...DEFAULT_SETTING,
            ...result,
        };

        ReactDOM.render(
            <Main/>,
            document.getElementById('main')
        );
    });
} else {
    window.setting = DEFAULT_SETTING;
    // 测试环境
    ReactDOM.render(
        <Main/>,
        document.getElementById('main')
    );
}
