'use strict';
// name, command, description, mode, kind. Commands are displayed and copied only.
const commandGroups = {
  windows: {name:'Windows', subtitle:'CMD · 网络诊断与本地用户', items:[
    ['连通性测试','ping <IP或域名>','发送 ICMP 请求，检查目标是否可达。目标不响应 ICMP 不一定表示离线。','CMD','read'],
    ['持续 Ping','ping -t <IP或域名>','持续测试连通性，按 Ctrl+C 停止并查看统计。','CMD','read'],
    ['指定 Ping 次数','ping -n 10 <IP或域名>','发送 10 次请求，观察丢包和延迟。','CMD','read'],
    ['路由追踪','tracert <IP或域名>','查看到目标的中间跳点；部分路由器可能不响应。','CMD','read'],
    ['路径与丢包分析','pathping <IP或域名>','结合路由追踪和丢包统计，运行可能需要几分钟。','CMD','read'],
    ['查看详细 IP 配置','ipconfig /all','显示 IP、子网掩码、默认网关、DNS 和网卡 MAC 地址。','CMD','read'],
    ['刷新 DNS 缓存','ipconfig /flushdns','清除本机 DNS 解析缓存，常用于域名解析排障。','管理员 CMD','config'],
    ['查询 DNS','nslookup <域名>','查询域名解析结果。可在命令末尾追加 DNS 服务器 IP。','CMD','read'],
    ['连接与端口','netstat -ano','查看 TCP / UDP 端口、连接状态和对应 PID。','CMD','read'],
    ['查看 ARP 缓存','arp -a','查看本机已学习到的 IP 与 MAC 地址映射。','CMD','read'],
    ['查看路由表','route print','查看 IPv4 / IPv6 路由和默认路由。','CMD','read'],
    ['查看本地用户','net user','列出本机用户账户；这是 Windows 本地用户管理命令。','CMD','read'],
    ['查看用户详情','net user <用户名>','查看指定用户的账户状态、组成员和密码策略信息。','CMD','read'],
    ['新增本地用户','net user <用户名> * /add','创建账户并交互输入密码，密码不会直接写在命令文本中。','管理员 CMD','config'],
    ['重设用户密码','net user <用户名> *','交互设置指定本地用户的新密码。','管理员 CMD','config'],
    ['查看本地组','net localgroup','列出本地组；组名称会因系统语言而不同。','CMD','read'],
    ['查看运行进程','tasklist','查看进程名称和 PID，可配合 netstat 定位占用端口的程序。','CMD','read'],
    ['查看系统信息','systeminfo','显示操作系统版本、安装信息和硬件概况。','CMD','read']
  ]},
  linux: {name:'Linux', subtitle:'Shell · 常见网络工具', items:[
    ['连通性测试','ping -c 4 <IP或域名>','发送 4 次 ICMP 请求后自动结束。','Shell','read'],
    ['查看网卡与 IP','ip addr show','查看网卡、IPv4 / IPv6 地址和接口状态。','Shell','read'],
    ['查看路由与网关','ip route show','查看 IPv4 路由表；default 项通常是默认网关。','Shell','read'],
    ['查看目的路由','ip route get <IP>','显示访问该目标会使用的路由、出口网卡和源地址。','Shell','read'],
    ['查看监听端口','ss -tuln','显示 TCP / UDP 监听端口，不解析主机名。','Shell','read'],
    ['端口与进程','sudo ss -tulnp','显示监听端口对应的进程，进程信息可能需要管理员权限。','sudo / Shell','read'],
    ['查看邻居 / ARP','ip neigh show','查看 IPv4 ARP 和 IPv6 邻居缓存。','Shell','read'],
    ['路由追踪','traceroute <IP或域名>','查看路由跳点；部分发行版需要先安装 traceroute。','Shell','read'],
    ['查询 DNS','dig <域名>','查看 DNS 响应详情；需要 dnsutils 或 bind-utils 软件包。','Shell','read'],
    ['检查 HTTP 响应','curl -I https://<域名>','请求 HTTP 响应头，检查状态码、重定向和服务响应。','Shell','read'],
    ['当前用户','whoami','显示当前有效用户名称。','Shell','read'],
    ['磁盘空间','df -h','以便于阅读的单位显示文件系统容量和剩余空间。','Shell','read']
  ]},
  cisco: {name:'Cisco 思科', subtitle:'IOS / IOS XE · 交换机', items:[
    ['进入特权模式','enable','从 Switch> 进入 Switch#；设备可能要求输入 enable 密码。','用户 EXEC（>）','read'],
    ['查看版本','show version','查看系统版本、设备型号、运行时长和镜像信息。','特权 EXEC（#）','read'],
    ['接口状态','show interfaces status','查看交换端口连接状态、VLAN、速率与双工模式。','特权 EXEC（#）','read'],
    ['IP 接口概览','show ip interface brief','查看三层接口的 IP 和协议状态。','特权 EXEC（#）','read'],
    ['查看 VLAN','show vlan brief','查看 VLAN 列表及 Access 端口成员。','特权 EXEC（#）','read'],
    ['查看 Trunk','show interfaces trunk','查看 Trunk 接口及允许通过的 VLAN。','特权 EXEC（#）','read'],
    ['查看 MAC 地址表','show mac address-table','查看交换机学习到的 MAC、VLAN 和出口端口。','特权 EXEC（#）','read'],
    ['查看 ARP','show ip arp','查看三层 IP 与 MAC 映射，通常需要三层接口。','特权 EXEC（#）','read'],
    ['查看路由表','show ip route','查看三层路由信息；设备需支持相关三层功能。','特权 EXEC（#）','read'],
    ['查看当前配置','show running-config','查看正在运行的配置，不等同于已保存的启动配置。','特权 EXEC（#）','read'],
    ['查看 CDP 邻居','show cdp neighbors','查看启用 CDP 的直连 Cisco 设备邻居。','特权 EXEC（#）','read'],
    ['连通性测试','ping <目标IP>','从交换机发起 Ping，用于验证管理或三层网络连通性。','特权 EXEC（#）','read'],
    ['创建 VLAN','configure terminal\nvlan 10\nname OFFICE\nend','创建示例 VLAN 10，命名为 OFFICE；请按网络规划修改 VLAN ID。','特权 EXEC（#）','config'],
    ['配置 Access 端口','configure terminal\ninterface <接口名>\nswitchport mode access\nswitchport access vlan 10\nend','把指定二层端口加入 VLAN 10。先创建 VLAN；接口例：GigabitEthernet1/0/1。','特权 EXEC（#）','config'],
    ['配置 Trunk 端口','configure terminal\ninterface <接口名>\nswitchport mode trunk\nswitchport trunk allowed vlan add 10,20\nend','设为 Trunk，并向允许列表添加 VLAN 10、20；不会清除已有允许列表。','特权 EXEC（#）','config'],
    ['启用接口','configure terminal\ninterface <接口名>\nno shutdown\nend','取消接口的管理关闭状态；实际链路状态还取决于对端和连接。','特权 EXEC（#）','config'],
    ['保存配置','copy running-config startup-config','把当前配置保存到启动配置；按设备提示确认目标文件名。','特权 EXEC（#）','config']
  ]},
  huawei: {name:'Huawei 华为', subtitle:'VRP · 交换机', items:[
    ['查看版本','display version','查看 VRP 版本、设备型号和运行信息。','用户视图（<设备名>）','read'],
    ['接口状态概览','display interface brief','查看接口物理与协议状态；不同型号的输出字段可能不同。','用户视图','read'],
    ['IP 接口概览','display ip interface brief','查看三层接口 IP、物理和协议状态。','用户视图','read'],
    ['查看 VLAN','display vlan','查看 VLAN 和端口成员信息。','用户视图','read'],
    ['查看端口 VLAN','display port vlan','查看二层端口链路类型、PVID 和允许 VLAN。','用户视图','read'],
    ['查看 MAC 地址表','display mac-address','查看已学习的 MAC、VLAN 和出口端口。','用户视图','read'],
    ['查看 ARP','display arp','查看 IP 与 MAC 地址映射，通常用于三层接口排障。','用户视图','read'],
    ['查看路由表','display ip routing-table','查看 IPv4 路由信息；设备需支持相应三层功能。','用户视图','read'],
    ['查看当前配置','display current-configuration','查看正在运行的配置；不等同于已保存配置。','用户视图','read'],
    ['查看 LLDP 邻居','display lldp neighbor brief','查看启用 LLDP 的直连邻居。','用户视图','read'],
    ['连通性测试','ping <目标IP>','从交换机发起 ICMP 请求，验证到目标的连通性。','用户视图','read'],
    ['进入系统视图','system-view','从 <设备名> 进入 [设备名]；需要相应配置权限。','用户视图','config'],
    ['创建 VLAN','system-view\nvlan 10\ndescription OFFICE\nquit\nreturn','创建示例 VLAN 10 并设置描述，最后返回用户视图。','用户视图','config'],
    ['配置 Access 端口','system-view\ninterface <接口名>\nport link-type access\nport default vlan 10\nquit\nreturn','把二层接口加入 VLAN 10。先创建 VLAN；接口例：GigabitEthernet0/0/1。','用户视图','config'],
    ['配置 Trunk 端口','system-view\ninterface <接口名>\nport link-type trunk\nport trunk allow-pass vlan 10 20\nquit\nreturn','设为 Trunk 并允许 VLAN 10、20 通过；其他已允许 VLAN 不会由此删除。','用户视图','config'],
    ['启用接口','system-view\ninterface <接口名>\nundo shutdown\nquit\nreturn','取消接口管理关闭状态，返回用户视图。','用户视图','config'],
    ['保存配置','save','保存当前配置；根据设备提示确认文件名和保存操作。','用户视图','config']
  ]}
};
let commandPlatform = ['all',...Object.keys(commandGroups)].includes(store.get('command-platform')) ? store.get('command-platform') : 'all';
const commands = Object.entries(commandGroups).flatMap(([platform,group])=>group.items.map(([name,code,description,mode,kind])=>({platform,name,code,description,mode,kind})));
$('command-total').textContent=`${commands.length} 条常用命令`;
function renderCommands() {
  const query=$('command-search').value.trim().toLocaleLowerCase();
  const terms=query.split(/\s+/).filter(Boolean), kind=$('command-kind').value;
  const matched=commands.filter(command=>{
    const text=[command.name,command.code,command.description,command.mode,commandGroups[command.platform].name].join(' ').toLocaleLowerCase();
    return (commandPlatform==='all'||command.platform===commandPlatform)&&(kind==='all'||command.kind===kind)&&terms.every(term=>text.includes(term));
  });
  $('command-results').replaceChildren();
  $('command-count').textContent=`显示 ${matched.length} / ${commands.length} 条命令`;
  $('clear-command-search').hidden=!query;
  document.querySelectorAll('[data-platform]').forEach(button=>{const active=button.dataset.platform===commandPlatform;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  if (!matched.length) {
    const empty=document.createElement('div');empty.className='command-empty';
    const title=document.createElement('h3');title.textContent='没有找到匹配的命令';
    const note=document.createElement('p');note.textContent='试试其他关键词，或点击“重置筛选”查看全部命令。';empty.append(title,note);$('command-results').append(empty);return;
  }
  for(const command of matched) {
    const card=document.createElement('article');card.className='command-card';
    const meta=document.createElement('div');meta.className='command-card-meta';
    const platform=document.createElement('span');platform.className='command-platform';platform.textContent=commandGroups[command.platform].name;
    const type=document.createElement('span');type.className='command-type '+command.kind;type.textContent=command.kind==='config'?'配置 / 更改':'查看 / 诊断';meta.append(platform,type);
    const heading=document.createElement('h3');heading.textContent=command.name;
    const description=document.createElement('p');description.className='command-description';description.textContent=command.description;
    const pre=document.createElement('pre');const code=document.createElement('code');code.textContent=command.code;pre.append(code);
    const footer=document.createElement('div');footer.className='command-card-footer';
    const mode=document.createElement('span');mode.textContent=command.mode;
    const button=document.createElement('button');button.type='button';button.className='command-copy';button.textContent='复制 ⧉';button.setAttribute('aria-label','复制'+command.name+'命令');button.addEventListener('click',()=>copy(command.code));footer.append(mode,button);
    card.append(meta,heading,description,pre,footer);$('command-results').append(card);
  }
}
document.querySelectorAll('[data-platform]').forEach(button=>button.addEventListener('click',()=>{commandPlatform=button.dataset.platform;store.set('command-platform',commandPlatform);renderCommands();}));
$('command-search').addEventListener('input',renderCommands);$('command-kind').addEventListener('change',renderCommands);
$('clear-command-search').addEventListener('click',()=>{$('command-search').value='';renderCommands();$('command-search').focus();});
$('reset-command-filters').addEventListener('click',()=>{commandPlatform='all';store.set('command-platform','all');$('command-search').value='';$('command-kind').value='all';renderCommands();});
renderCommands();
