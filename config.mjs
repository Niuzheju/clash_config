export function main(config) {
    // ==================== 可配置的代理组变量（在这里统一修改） ====================
    const PROXY = "PROXY";           // 全局代理组
    const AI_GROUP = "PROXY";            // AI 服务专用组
    const DIRECT = "DIRECT";
    const REJECT = "REJECT";

    // ==================== 1. 添加/覆盖 rule-providers ====================
    config["rule-providers"] = {};

    Object.assign(config["rule-providers"], {
        advertising_reject: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Advertising/Advertising_Classical.yaml",
            path: "./ruleset/advertising_reject.yaml",
            interval: 86400
        },
        windows_update: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/WindowsUpdate/WindowsUpdate_Classical.yaml",
            path: "./ruleset/windows_update.yaml",
            interval: 86400
        },
        microsoft_services: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft_Classical.yaml",
            path: "./ruleset/microsoft_services.yaml",
            interval: 86400
        },
        gfw_list: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
            path: "./ruleset/gfw_list.yaml",
            interval: 86400
        },
        china_apps: {
            type: "http",
            behavior: "classical",
            url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
            path: "./ruleset/china_apps.yaml",
            interval: 86400
        },
        china_domains: {
            type: "http",
            behavior: "domain",
            url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
            path: "./ruleset/china_domains.yaml",
            interval: 86400
        },
        china_ip: {
            type: "http",
            behavior: "ipcidr",
            url: "https://fastly.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
            path: "./ruleset/china_ip.yaml",
            interval: 86400
        }
    });

    const bypassApps = [
        "thunder.exe",
        "WeChat",           // 微信
        "WeChat.exe",
        "QQ",               // QQ
        "QQ.exe",
        "TIM.exe",
        "DingTalk",         // 钉钉
        "DingTalk.exe",
        "wxwork",           // 企业微信
        "wxwork.exe"
    ];

    const customRules = [];

    bypassApps.forEach(app => {
        customRules.push(`PROCESS-NAME,${app},${DIRECT}`);
    });

    // ==================== 自定义规则（优先级从高到低） ====================
    customRules.push(
        // 1. 特定域名直连或代理
        "DOMAIN,dog.ssrdog.com," + PROXY,

        // 2. 局域网与本地回路（最高优先级）
        "DOMAIN-SUFFIX,local," + DIRECT,
        "IP-CIDR,10.0.0.0/8," + DIRECT + ",no-resolve",
        "IP-CIDR,172.16.0.0/12," + DIRECT + ",no-resolve",
        "IP-CIDR,192.168.0.0/16," + DIRECT + ",no-resolve",
        "IP-CIDR,127.0.0.0/8," + DIRECT + ",no-resolve",

        // ==================== AI 服务域名规则（优化加强版） ====================
        // ChatGPT / OpenAI
        "DOMAIN-SUFFIX,chatgpt.com," + AI_GROUP,
        "DOMAIN-SUFFIX,openai.com," + AI_GROUP,
        "DOMAIN-SUFFIX,oaistatic.com," + AI_GROUP,
        "DOMAIN-SUFFIX,oaiusercontent.com," + AI_GROUP,
        "DOMAIN-SUFFIX,oaistatsig.com," + AI_GROUP,
        "DOMAIN-SUFFIX,auth.openai.com," + AI_GROUP,
        "DOMAIN-SUFFIX,chat.openai.com," + AI_GROUP,
        "DOMAIN-SUFFIX,api.chatgpt.com," + AI_GROUP,
        "DOMAIN-SUFFIX,ws.chatgpt.com," + AI_GROUP,

        // Grok / xAI（重点加强）
        "DOMAIN-SUFFIX,grok.com," + AI_GROUP,
        "DOMAIN-SUFFIX,grok.x.ai," + AI_GROUP,
        "DOMAIN-SUFFIX,grok.x.com," + AI_GROUP,
        "DOMAIN-SUFFIX,x.ai," + AI_GROUP,
        "DOMAIN-SUFFIX,api.x.ai," + AI_GROUP,
        "DOMAIN-SUFFIX,assets.grok.com," + AI_GROUP,
        "DOMAIN-SUFFIX,auth.grok.com," + AI_GROUP,
        "DOMAIN-SUFFIX,auth.x.ai," + AI_GROUP,
        "DOMAIN-SUFFIX,cli-chat-proxy.grok.com," + AI_GROUP,

        // Gemini / Google AI
        "DOMAIN-SUFFIX,gemini.google.com," + AI_GROUP,
        "DOMAIN-SUFFIX,generativelanguage.googleapis.com," + AI_GROUP,
        "DOMAIN-SUFFIX,googleapis.com," + AI_GROUP,
        "DOMAIN-SUFFIX,gstatic.com," + AI_GROUP,

        // 其他常用 AI
        "DOMAIN-SUFFIX,intercom.io," + AI_GROUP,
        "DOMAIN-SUFFIX,intercomcdn.com," + AI_GROUP,
        "DOMAIN-SUFFIX,cloudflare.com," + AI_GROUP);

    // ==================== 合并规则集（Rule-Set） ====================
    const ruleSets = [
        {ruleSet: "advertising_reject", target: REJECT},
        {ruleSet: "windows_update", target: DIRECT},
        {ruleSet: "microsoft_services", target: DIRECT},
        {ruleSet: "gfw_list", target: PROXY},
        {ruleSet: "china_apps", target: DIRECT},
        {ruleSet: "china_domains", target: DIRECT},
        {ruleSet: "china_ip", target: DIRECT, noResolve: true},
    ];

    // ==================== 构建最终 rules 数组 ====================
    let finalRules = [...customRules];

    ruleSets.forEach(item => {
        let rule = `RULE-SET,${item.ruleSet},${item.target}`;
        if (item.noResolve) rule += ",no-resolve";
        finalRules.push(rule);
    });

    // 兜底规则
    finalRules.push(`MATCH,${PROXY}`);

    // 替换或追加到 config.rules
    //if (config.rules) {
    //config.rules = finalRules.concat(config.rules);  // prepend 自定义规则
    //} else {
    //config.rules = finalRules;
    //}

    config["rules"] = finalRules;

    return config;
}