import React, {Component} from 'react';
import 'antd/dist/antd.css';
import {Switch, Collapse, Input, Select, Button, Badge, Tooltip} from 'antd';
const Panel = Collapse.Panel;

import Replacer from './Replacer';

import './Main.less';

const buildUUID = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}


const companyData =JSON.parse(localStorage.getItem("companyDataW"))


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
    }

    state = {
        interceptedRequests: {},
        companyData: []
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

//handle方法setState省份值
    handleChange= (value) => {
        console.log("handleChange")
        console.log(value)
        window.setting.ShowH5Company_rules = value;
        this.set('ShowH5Company_rules', value);
        this.forceUpdate();
    }


    render() {
        return (
            <div className="main">
                <div className="all-switch" style={{width: "100%"}}>
                    <div style={{float: "left"}}>全局开关</div>
                    <Switch
                        style={{zIndex: 10, marginLeft: "450px"}}
                        defaultChecked={window.setting.ajaxInterceptor_switchOn}
                        onChange={this.handleSwitchChange}
                    />
                    <div style={{float: "left"}}>H5显示工号ID</div>
                    <Switch
                        style={{zIndex: 10, marginLeft: "419px"}}
                        defaultChecked={window.setting.ajaxInterceptor_switchShowH5ChannelIdOn}
                        onChange={this.handleSwitchShowH5ChannelIdOnChange}
                    />
                    <div style={{float: "left"}}>过滤保司显示</div>
                    <Select
                        mode="multiple"
                        style={{width: '60%', marginLeft: "120px"}}
                        placeholder="选择保司"
                        defaultValue={window.setting.ShowH5Company_rules}
                        onChange={(value)=>{this.handleChange(value)}}
                        filterOption={(input, option) => {
                            let childrenList = option.props.children
                            if (childrenList[0].toString() === input.toString()) {
                                return true
                            } else return childrenList[2].indexOf(input) >= 0;
                        }
                        }
                    >
                        {this.companyData.map(item => (
                            <Select.Option value={item.id}>{item.id}-{item.name}</Select.Option>
                        ))}
                    </Select>
                </div>
                <div
                    className={window.setting.ajaxInterceptor_switchOn ? 'settingBody' : 'settingBody settingBody-hidden'}>
                    {window.setting.ajaxInterceptor_rules && window.setting.ajaxInterceptor_rules.length > 0 ? (
                        <div ref={ref => this.collapseWrapperRef = ref}>
                            <Collapse
                                className={window.setting.ajaxInterceptor_switchOn ? 'collapse' : 'collapse collapse-hidden'}
                                onChange={this.handleCollaseChange}
                                // onChangeDone={this.handleCollaseChange}
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
                                                    {/*                   <Input
                              placeholder="字段过滤"
                              style={{width: '40%'}}
                              defaultValue={label}
                              onChange={e => this.handleLabelChange(e, i)}/>
                          <Select defaultValue={filterType} style={{width: '30%'}} onChange={e => this.handleFilterTypeChange(e, i)}>
                            <Option value="==">==</Option>
                          </Select>
                          <Input
                              placeholder="过滤值"
                              style={{width: '30%'}}
                              defaultValue={label}
                              onChange={e => this.handleLabelChange(e, i)}/>*/}
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
                                        {/* <div className="replace-with">
                      Replace With:
                    </div>
                    <textarea
                      className="overrideTxt"
                      // placeholder="replace with"
                      style={{resize: 'none'}}
                      defaultValue={overrideTxt}
                      onChange={e => this.handleOverrideTxtChange(e.target.value, i)}
                    />
                    <Switch onChange={this.handleEditorSwitch} checkedChildren="JSON editor" unCheckedChildren="JSON editor" size="small" />
                    {this.state.showJSONEditor && <div className="JSONEditor">
                      <ReactJson
                        name=""
                        src={JSON.parse(overrideTxt)}
                        onEdit={val => this.handleJSONEditorChange(val, i)}
                        onAdd={val => this.handleJSONEditorChange(val, i)}
                        onDelete={val => this.handleJSONEditorChange(val, i)}
                      />
                    </div>} */}
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
