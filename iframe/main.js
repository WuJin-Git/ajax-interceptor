import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Select, Button, Badge, Tooltip, message} from 'antd';
import querystring from 'querystring';

const Panel = Collapse.Panel;

import Replacer from './Replacer';

import './Main.less';
import request from "./request-utils";

const buildUUID = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}



let timeout;
let currentValue;
const companyData = []
const data = []
const value = undefined

export default class Main extends Component {
    constructor(props) {
        super(props);
        chrome.runtime.onMessage.addListener(({type, to, url, match}) => {
            if (type === 'ajaxInterceptor' && to === 'iframe') {
                const {interceptedRequests} = this.state;
                if (!interceptedRequests[match]) interceptedRequests[match] = [];

                const exits = interceptedRequests[match].some(obj => {
                    if (obj.url === url) {
                        obj.num++;
                        return true;
                    }
                    return false;
                });

                if (!exits) {
                    interceptedRequests[match].push({url, num: 1});
                }
                this.setState({interceptedRequests}, () => {
                    if (!exits) {
                        // 新增的拦截的url，会多展示一行url，需要重新计算高度
                        this.updateAddBtnTop_interval();
                    }
                })
            }
        });


        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'ajaxInterceptor',
            to: 'background',
            iframeScriptLoaded: true
        });

        this.collapseWrapperHeight = -1;
        this.companyData = companyData
        this.disableChannel = undefined
        this.data = data
        this.value = value
        this.handleGetCompanyDate()

    }

    state = {
        interceptedRequests: {},
        companyData: [],
        disableChannel: undefined,
        data: [],
        value: undefined
    }

    componentDidMount() {
        this.updateAddBtnTop_interval();
    }


    updateAddBtnTop = () => {
        let curCollapseWrapperHeight = this.collapseWrapperRef ? this.collapseWrapperRef.offsetHeight : 0;
        if (this.collapseWrapperHeight !== curCollapseWrapperHeight) {
            this.collapseWrapperHeight = curCollapseWrapperHeight;
            clearTimeout(this.updateAddBtnTopDebounceTimeout);
            this.updateAddBtnTopDebounceTimeout = setTimeout(() => {
                this.addBtnRef.style.top = `${curCollapseWrapperHeight + 30}px`;
            }, 50);
        }
    }

    // 计算按钮位置
    updateAddBtnTop_interval = ({timeout = 1000, interval = 50} = {}) => {
        const i = setInterval(this.updateAddBtnTop, interval);
        setTimeout(() => {
            clearInterval(i);
        }, timeout);
    }

    set = (key, value) => {
        // 发送给background.js
        chrome.runtime.sendMessage(chrome.runtime.id, {type: 'ajaxInterceptor', to: 'background', key, value});
        chrome.storage && chrome.storage.local.set({[key]: value});
    }

    forceUpdateDebouce = () => {
        clearTimeout(this.forceUpdateTimeout);
        this.forceUpdateTimeout = setTimeout(() => {
            this.forceUpdate();
        }, 1000);
    }

    handleSingleSwitchChange = (switchOn, i) => {
        window.setting.ajaxInterceptor_rules[i].switchOn = switchOn;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        // 这么搞主要是为了能实时同步window.setting.ajaxInterceptor_rules，并且让性能好一点
        this.forceUpdateDebouce();
    }

    handleFilterTypeChange = (val, i) => {
        window.setting.ajaxInterceptor_rules[i].filterType = val;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        this.forceUpdate();
    }

    handleMatchChange = (e, i) => {
        window.setting.ajaxInterceptor_rules[i].match = e.target.value;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        this.forceUpdateDebouce();
    }

    handleLabelChange = (e, i) => {
        window.setting.ajaxInterceptor_rules[i].label = e.target.value;
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        this.forceUpdateDebouce();
    }

    handleClickAdd = () => {
        window.setting.ajaxInterceptor_rules.push({
            match: '',
            label: `url${window.setting.ajaxInterceptor_rules.length + 1}`,
            switchOn: true,
            key: buildUUID()
        });
        this.forceUpdate(this.updateAddBtnTop_interval);
    }

    handleClickRemove = (e, i) => {
        e.stopPropagation();
        const {interceptedRequests} = this.state;
        const match = window.setting.ajaxInterceptor_rules[i].match;
        const label = window.setting.ajaxInterceptor_rules[i].label;

        window.setting.ajaxInterceptor_rules = [
            ...window.setting.ajaxInterceptor_rules.slice(0, i),
            ...window.setting.ajaxInterceptor_rules.slice(i + 1),
        ];
        this.set('ajaxInterceptor_rules', window.setting.ajaxInterceptor_rules);

        delete interceptedRequests[match];
        delete interceptedRequests[label];
        this.setState({interceptedRequests}, this.updateAddBtnTop_interval);
    }

    handleCollaseChange = ({timeout = 1200, interval = 50}) => {
        this.updateAddBtnTop_interval();
    }

    handleSwitchChange = () => {
        window.setting.ajaxInterceptor_switchOn = !window.setting.ajaxInterceptor_switchOn;
        this.set('ajaxInterceptor_switchOn', window.setting.ajaxInterceptor_switchOn);
        this.forceUpdate();
    }

    handleSwitchShowH5ChannelIdOnChange = () => {
        window.setting.ajaxInterceptor_switchShowH5ChannelIdOn = !window.setting.ajaxInterceptor_switchShowH5ChannelIdOn;
        this.set('ajaxInterceptor_switchShowH5ChannelIdOn', window.setting.ajaxInterceptor_switchShowH5ChannelIdOn);
        this.forceUpdate();
    }

    handleAjaxInterceptorShowH5CompanyRulesOnChange = () => {
        window.setting.ajaxInterceptor_ShowH5Company_rules_on = !window.setting.ajaxInterceptor_ShowH5Company_rules_on;
        this.set('ajaxInterceptor_ShowH5Company_rules_on', window.setting.ajaxInterceptor_ShowH5Company_rules_on);
        this.forceUpdate();
    }

//handle方法setState
    handleChange = (value) => {
        window.setting.ShowH5Company_rules = value;
        this.set('ShowH5Company_rules', value);
        this.forceUpdate();
    }


    fetch = (value, callback) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        currentValue = value;

        function fake() {
            request({
                url: '/api/channel/select_channel_list',
                method: 'post',
                data: {
                    "page": 1,
                    "size": 10,
                    "model": {
                        "sourceId": "test-01",
                        "company": "",
                        "keyType": 3,
                        "keyWord": value,
                        "date": [],
                        "loading": true,
                        "area": "",
                        "codeType": 2
                    },
                    "data_env": "test"
                }
            }).then(function (d) {
                if (currentValue === value) {
                    const data = [];
                    d.data.model.forEach(r => {
                        data.push({
                            value: r['id'],
                            text: r['id'] + "-" + r['channelName'],
                        });
                    });
                    callback(data);
                }
            })
        }

        timeout = setTimeout(fake, 300);
    }
    getCompanyDate = (callback) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        function fake() {
            request({
                url: '/api/channel/select_channel_company_list',
                method: 'get',
            }).then(function (res) {
                if (res['data'] !== undefined && res['data'] != null) {
                    callback(res['data']);
                } else {
                    callback([]);
                }
            })
        }

        timeout = setTimeout(fake, 500);
    }

    handleGetCompanyDate = () => {
        if(window.setting.parent_href.indexOf('ybinsure.com/spa')>-1){
            this.getCompanyDate(companyData => this.setState({companyData: companyData}))
        }
    };


    handleSearch = (value) => {
        if (value && window.setting.parent_href.indexOf('ybinsure.com/spa')>-1) {
            this.fetch(value, data => this.setState({data}));
        } else {
            this.setState({data: []});
        }
    };

    handleChangeInput = value => {
        this.setState({value});
    };

    handleDisableChannel = () => {
        if (this.state.value === undefined || this.state.value === "") {
            return
        }
        request({
            url: '/api/channel/disable',
            method: 'post',
            data: {id: this.state.value, env: "test"}
        }).then(function (d) {
            if (d.data === 200) {
                message.success('操作成功', 2.5)
            } else {
                message.error("操作失败", 2.5)
            }
        })
        this.setState({value: undefined})
    };

    handleDeleteChannel = () => {
        if (this.state.value === undefined || this.state.value === "") {
            return
        }
        request({
            url: '/api/channel/delete',
            method: 'post',
            data: {id: this.state.value, env: "test"}
        }).then(function (d) {
            if (d.data === 1) {
                message.success('操作成功', 2.5)
            } else {
                message.error("操作失败", 2.5)
            }
        })
        this.setState({value: undefined})
    };


    render() {
        return (
            <div className="main">
                <div className="all-switch" style={{width: "100%"}}>
                    <div style={{float: "left",marginTop: "20px"}}>全局开关</div>
                    <Switch
                        style={{zIndex: 10, marginLeft: "450px",marginTop: "20px"}}
                        defaultChecked={window.setting.ajaxInterceptor_switchOn}
                        onChange={this.handleSwitchChange}
                    />
                    <div style={{float: "left",marginTop: "20px"}}>H5显示工号ID</div>
                    <Switch
                        style={{zIndex: 10, marginLeft: "419px",marginTop: "20px"}}
                        defaultChecked={window.setting.ajaxInterceptor_switchShowH5ChannelIdOn}
                        onChange={this.handleSwitchShowH5ChannelIdOnChange}
                    />
                    <div style={{float: "left",marginTop: "20px"}}>过滤保司显示</div>
                    <Select
                        mode="multiple"
                        style={{width: '60%', marginLeft: "78px",marginTop: "20px"}}
                        placeholder="选择保司"
                        defaultValue={window.setting.ShowH5Company_rules}
                        onChange={(value) => {
                            this.handleChange(value)
                        }}
                        filterOption={(input, option) => {
                            let childrenList = option.props.children
                            if (childrenList[0].toString() === input.toString()) {
                                return true
                            } else return childrenList[2].indexOf(input) >= 0;
                        }
                        }
                    >
                        {this.state.companyData.map(item => (
                            <Option value={item.id}>{item.id}-{item.name}</Option>
                        ))}
                    </Select>
                    <Switch
                        style={{zIndex: 10,marginTop: "20px"}}
                        defaultChecked={window.setting.ajaxInterceptor_ShowH5Company_rules_on}
                        onChange={this.handleAjaxInterceptorShowH5CompanyRulesOnChange}
                    />
                    <div style={{float: "left",marginTop: "20px"}}>工号操作(测试环境)</div>
                    <Select
                        showSearch
                        allowClear
                        value={this.state.value}
                        placeholder='请输入工号ID'
                        style={{marginLeft: '42px', width: '47%',marginTop: "20px"}}
                        defaultActiveFirstOption={true}
                        showArrow={false}
                        filterOption={false}


                        onSearch={this.handleSearch}
                        onChange={this.handleChangeInput}
                        notFoundContent={"查询结果为空"}
                    >
                        {this.state.data.map((d) => (<Option key={d.value}>{d.text}</Option>))}
                    </Select>
                    <Button size={"small"} type="primary" style={{marginLeft: '10px',marginTop: "20px"}}
                            onClick={this.handleDisableChannel}>
                        禁用
                    </Button>
                    <Button size={"small"} type="danger" style={{marginLeft: '10px',marginTop: "20px"}}
                            onClick={this.handleDeleteChannel}>
                        删除
                    </Button>
                </div>
                <div style={{marginTop: "40px"}}>数据模拟mock:</div>
                <div
                    className={window.setting.ajaxInterceptor_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
                    {window.setting.ajaxInterceptor_rules && window.setting.ajaxInterceptor_rules.length > 0 ? (
                        <div ref={ref => this.collapseWrapperRef = ref}>
                            <Collapse
                                className={window.setting.ajaxInterceptor_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                                onChange={this.handleCollaseChange}
                            >
                                {window.setting.ajaxInterceptor_rules.map(({
                                                                               filterType = 'normal',
                                                                               match,
                                                                               label,
                                                                               overrideTxt,
                                                                               switchOn = true,
                                                                               key
                                                                           }, i) => (
                                    <Panel
                                        key={key}
                                        header={
                                            <div className="panel-header" onClick={e => e.stopPropagation()}>
                                                <Input.Group compact style={{width: '78%'}}>
                                                    <Input
                                                        placeholder="name"
                                                        style={{width: '20%'}}
                                                        defaultValue={label}
                                                        onChange={e => this.handleLabelChange(e, i)}/>
                                                    <Select defaultValue={filterType} style={{width: '30%'}}
                                                            onChange={e => this.handleFilterTypeChange(e, i)}>
                                                        <Option value="normal">normal</Option>
                                                        <Option value="regex">regex</Option>
                                                    </Select>
                                                    <Input
                                                        placeholder={filterType === 'normal' ? 'eg: abc/get' : 'eg: abc.*'}
                                                        style={{width: '50%'}}
                                                        defaultValue={match}
                                                        // onClick={e => e.stopPropagation()}
                                                        onChange={e => this.handleMatchChange(e, i)}
                                                    />
                                                </Input.Group>
                                                <Switch
                                                    size="small"
                                                    defaultChecked={switchOn}
                                                    onChange={val => this.handleSingleSwitchChange(val, i)}
                                                />
                                                <Button
                                                    style={{marginRight: '16px'}}
                                                    type="primary"
                                                    shape="circle"
                                                    icon="minus"
                                                    size="small"
                                                    onClick={e => this.handleClickRemove(e, i)}
                                                />
                                            </div>
                                        }
                                    >
                                        <Replacer
                                            defaultValue={overrideTxt}
                                            updateAddBtnTop={this.updateAddBtnTop}
                                            index={i}
                                            set={this.set}
                                        />
                                        {this.state.interceptedRequests[match] && (
                                            <>
                                                <div className="intercepted-requests">
                                                    Intercepted Requests:
                                                </div>
                                                <div className="intercepted">
                                                    {this.state.interceptedRequests[match] && this.state.interceptedRequests[match].map(({
                                                                                                                                             url,
                                                                                                                                             num
                                                                                                                                         }) => (
                                                        <Tooltip placement="top" title={url} key={url}>
                                                            <Badge
                                                                count={num}
                                                                style={{
                                                                    backgroundColor: '#fff',
                                                                    color: '#999',
                                                                    boxShadow: '0 0 0 1px #d9d9d9 inset',
                                                                    marginTop: '-3px',
                                                                    marginRight: '4px'
                                                                }}
                                                            />
                                                            <span className="url">{url}</span>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                    ) : <div/>}
                    <div ref={ref => this.addBtnRef = ref} className="wrapper-btn-add">
                        <Button
                            className={`btn-add ${window.setting.ajaxInterceptor_switchOn ? '' : ' btn-add-hidden'}`}
                            type="primary"
                            shape="circle"
                            icon="plus"
                            onClick={this.handleClickAdd}
                            disabled={!window.setting.ajaxInterceptor_switchOn}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
