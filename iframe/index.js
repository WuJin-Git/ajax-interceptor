import React from 'react';
import ReactDOM from 'react-dom';

import Main from './Main';
import request from "./request-utils";

const DEFAULT_SETTING = {
    ajaxInterceptor_switchOn: false,
    ajaxInterceptor_switchShowH5ChannelIdOn: false,
    ajaxInterceptor_rules: [],
    ShowH5Company_rules: [],
    ajaxInterceptor_ShowH5Company_rules_on: false,
    parent_href: 'aaa',
}


if (chrome.storage) {
    const fields = ['ajaxInterceptor_switchOn','parent_href', 'ajaxInterceptor_switchShowH5ChannelIdOn', 'ajaxInterceptor_rules', 'ShowH5Company_rules', 'ajaxInterceptor_ShowH5Company_rules_on']
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



