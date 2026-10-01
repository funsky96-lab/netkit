'use strict';
const $ = id => document.getElementById(id);
const kit = window.NetKit;
const store = {get(key) {try {return localStorage.getItem('netkit-'+key);} catch {return null;}},set(key,value) {try {localStorage.setItem('netkit-'+key,value);} catch {}}};
const fmt = n=>n.toLocaleString('en-US');
const ip = kit.numberToIp;
let network, networkText='', timeText='', rates, rateDate, rateCached=false, loading=false;
let toastTimer;
function toast(text) { $('toast').textContent=text; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,2500); }
async function copy(text) {
  if (!text) return;
  try {await navigator.clipboard.writeText(text);toast('已复制到剪贴板');} catch {toast('复制不可用，请选择结果文字手动复制。');}
}
document.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>showTool(button.dataset.tool)));
function showTool(name) {
  if (!['network','time','currency','commands'].includes(name)) name='network';
  document.querySelectorAll('.tool-panel').forEach(panel=>panel.hidden=panel.id!==name);
  document.querySelectorAll('[data-tool]').forEach(button=>{const selected=button.dataset.tool===name;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
  store.set('tool',name);
}
showTool(store.get('tool'));
function stat(label,value,wide=false) {return `<div class="stat${wide?' wide':''}"><span>${label}</span><strong>${value}</strong></div>`;}
function calculate() {
  $('network-error').textContent='';
  try {
    const result=kit.calculateNetwork($('ip').value,$('mask').value,$('gateway').value); network=result;
    const n=result;
    const gateway=n.gatewayNumber!==null?`已校验网关：<b>${ip(n.gatewayNumber)}</b>（在可用范围内）` : n.candidates.length ? `网关候选：<b>${n.candidates.map(ip).join(' / ')}</b><br>仅为候选，使用前请确认路由器配置。` : '/32 是单个主机地址，没有子网内独立网关。';
    $('network-result').innerHTML=`<div class="network-banner"><span>网络地址 / CIDR</span><strong>${ip(n.network)} /${n.prefix}</strong><small>${fmt(n.size)} 个总地址 · ${fmt(n.hosts)} 个可用地址</small></div><div class="stat-grid">${stat('子网掩码',ip(n.mask))}${stat('通配符掩码',ip(n.wildcard))}${stat(n.prefix>=31?'地址范围终点':'广播地址',ip(n.last))}${stat('可用地址数',fmt(n.hosts))}${stat('可用 IP 范围',`${ip(n.firstHost)} — ${ip(n.lastHost)}`,true)}</div>${!n.inputUsable?'<p class="network-warning">输入 IP 是网络地址或广播地址，不能分配给普通主机。</p>':''}${n.prefix>=31?'<p class="field-note">'+(n.prefix===31?'/31：点对点链路，两端地址均可用，无广播地址。':'/32：单个主机地址，无广播地址。')+'</p>':''}<p class="gateway-result">${gateway}</p>`;
    networkText=`IP: ${ip(n.address)}\n网络: ${ip(n.network)}/${n.prefix}\n掩码: ${ip(n.mask)}\n通配符: ${ip(n.wildcard)}\n${n.prefix>=31?'地址终点':'广播'}: ${ip(n.last)}\n可用范围: ${ip(n.firstHost)} - ${ip(n.lastHost)}\n可用地址数: ${n.hosts}\n${n.gatewayNumber!==null?'已校验网关: '+ip(n.gatewayNumber):'网关候选（请确认路由器配置）: '+(n.candidates.map(ip).join(', ')||'无')}`;
    $('split-prefix').innerHTML='';
    for (let prefix=n.prefix+1;prefix<=32;prefix++) {const option=document.createElement('option');option.value=prefix;option.textContent=`/${prefix} · ${fmt(2**(prefix-n.prefix))} 个子网`;$('split-prefix').append(option);}
    $('split-prefix').disabled=n.prefix===32;
    $('split-form').querySelector('button').disabled=n.prefix===32;
    $('split-result').textContent=n.prefix===32?'/32 已经是单个地址，无法继续划分。':'选择新前缀，查看子网清单。';
    $('split-error').textContent='';
    store.set('network',JSON.stringify({ip:$('ip').value,mask:$('mask').value,gateway:$('gateway').value}));
  } catch(e) {
    $('network-error').textContent=e.message;network=null;networkText='';
    $('network-result').textContent='请修正输入，重新计算网络。';$('split-result').textContent='请先计算有效的网络。';
    $('split-prefix').innerHTML='';$('split-prefix').disabled=true;$('split-form').querySelector('button').disabled=true;
  }
}
$('network-form').addEventListener('submit',event=>{event.preventDefault();calculate();});
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{const [address,prefix]=button.dataset.example.split('/');$('ip').value=address;$('mask').value='/'+prefix;$('gateway').value='';calculate();}));
$('copy-network').addEventListener('click',()=>copy(networkText));
$('split-form').addEventListener('submit',event=>{
  event.preventDefault();$('split-error').textContent='';
  try {
    if (!network) throw new Error('请先计算有效的网络。');
    const prefix=Number($('split-prefix').value), result=kit.splitNetwork(network,prefix);
    $('split-result').innerHTML=`<div class="subnet-summary"><strong>${fmt(result.count)}</strong><span>个 /${prefix} 子网${result.count>256?' · 仅展示前 256 个，避免页面卡顿':''}</span></div><div class="table-scroll" tabindex="0" role="region" aria-label="子网划分结果"><table><thead><tr><th>#</th><th>网络 / CIDR</th><th>可用地址范围</th><th>${prefix>=31?'地址终点':'广播地址'}</th><th>可用地址</th></tr></thead><tbody>${result.rows.map((n,i)=>`<tr><td>${i+1}</td><td>${ip(n.network)}/${n.prefix}</td><td>${ip(n.firstHost)} – ${ip(n.lastHost)}</td><td>${ip(n.last)}</td><td>${fmt(n.hosts)}</td></tr>`).join('')}</tbody></table></div>`;
  } catch(e) {$('split-error').textContent=e.message;}
});
try {const saved=JSON.parse(store.get('network'));if(saved){$('ip').value=saved.ip;$('mask').value=saved.mask;$('gateway').value=saved.gateway||'';}} catch {}
calculate();
function updateClocks() {const now=new Date();for(const zone of ['utc','sgt']){const value=kit.dateParts(now,zone);$('clock-'+zone).textContent=value.time;$('date-'+zone).textContent=value.date;}}
updateClocks();setInterval(updateClocks,1000);
function useNow() {const value=kit.dateParts(new Date(),$('time-zone').value);$('time-input').value=value.date+'T'+value.time;convertTime();}
function convertTime() {
  $('time-error').textContent='';timeText='';
  try {
    const source=$('time-zone').value, target=source==='utc'?'sgt':'utc';
    const date=kit.parseDateTime($('time-input').value,source),parts=kit.dateParts(date,target);
    const sourceDate=kit.dateParts(date,source).date,day=parts.date===sourceDate?'同一天':parts.date>sourceDate?'次日':'前一天';
    $('time-result-zone').textContent=target==='sgt'?'新加坡时间 · SGT':'世界协调时间 · UTC';
    $('time-result').innerHTML=`<p class="converted-date">${parts.date}</p><div class="converted-time">${parts.time}</div><p class="day-note">${day} · ${target==='sgt'?'UTC+08:00':'UTC+00:00'}</p>`;
    const s=kit.dateParts(date,source);
    timeText=`${s.date} ${s.time} ${source.toUpperCase()} → ${parts.date} ${parts.time} ${target.toUpperCase()}`;
  } catch(e) {$('time-error').textContent=e.message;$('time-result').textContent='请填写有效的日期与时间。';}
}
$('time-form').addEventListener('submit',event=>{event.preventDefault();convertTime();});
$('time-zone').addEventListener('change',convertTime);$('time-input').addEventListener('input',convertTime);
$('use-now').addEventListener('click',useNow);$('copy-time').addEventListener('click',()=>copy(timeText));useNow();
const currencies={sgd:'新加坡元',cny:'人民币',usd:'美元',eur:'欧元',gbp:'英镑',jpy:'日元',hkd:'港元',myr:'马来西亚林吉特',aud:'澳元',twd:'新台币',krw:'韩元',thb:'泰铢',idr:'印尼盾',inr:'印度卢比',cad:'加拿大元',chf:'瑞士法郎',nzd:'新西兰元',php:'菲律宾比索',vnd:'越南盾',aed:'阿联酋迪拉姆'};
for(const id of ['currency-from','currency-to']) for(const [code,name] of Object.entries(currencies)){const option=document.createElement('option');option.value=code;option.textContent=`${code.toUpperCase()} · ${name}`;$(id).append(option);}
const savedFrom=store.get('from'),savedTo=store.get('to');
$('currency-from').value=currencies[savedFrom]?savedFrom:'sgd';$('currency-to').value=currencies[savedTo]?savedTo:'cny';
function renderConversion() {
  $('currency-error').textContent='';
  try {
    if (!rates) throw new Error('汇率尚未加载，请稍后或点击刷新汇率。');
    const from=$('currency-from').value,to=$('currency-to').value;
    if (!$('amount').value.trim()) throw new Error('请输入兑换金额。');
    const amount=Number($('amount').value),result=kit.conversion(amount,from,to,rates);
    const digits=['jpy','krw','vnd','idr'].includes(to)?0:2;
    $('currency-result').innerHTML=`<p class="money-source">${amount.toLocaleString('en-US',{maximumFractionDigits:8})} ${from.toUpperCase()} 可兑换</p><div class="money-value">${result.total.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits})}<span>${to.toUpperCase()} · ${currencies[to]}</span></div><p class="exchange-rate">1 ${from.toUpperCase()} = ${result.rate.toLocaleString('en-US',{maximumSignificantDigits:8})} ${to.toUpperCase()}</p>`;
    store.set('from',from);store.set('to',to);
  } catch(e) {$('currency-error').textContent=e.message;$('currency-result').textContent='暂时无法显示兑换结果。';}
}
function validRateData(data) {
  return data && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && data.usd && Object.keys(currencies).every(code=>Number.isFinite(data.usd[code])&&data.usd[code]>0);
}
function rateStatus() {
  const age=Math.floor((Date.now()-Date.parse(rateDate+'T00:00:00Z'))/86400000);
  $('rate-status').textContent=`汇率日期 ${rateDate}${rateCached?' · 本地缓存':''}${age>2?' · 数据较旧，请刷新':''}`;
}
async function loadRates() {
  if (loading) return;
  loading=true;$('refresh-rates').disabled=true;$('refresh-rates').textContent='获取中…';$('rate-status').textContent='正在获取每日汇率…';
  try {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    let data;
    try {
      const response=await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',{signal:controller.signal,cache:'no-store'});
      if (!response.ok) throw new Error('汇率服务暂时不可用');data=await response.json();
    } finally {clearTimeout(timer);}
    if (!validRateData(data)) throw new Error('汇率数据不完整');
    rates=data.usd;rateDate=data.date;rateCached=false;store.set('rates',JSON.stringify(data));rateStatus();renderConversion();
  } catch(e) {
    if (rates) {rateCached=true;rateStatus();renderConversion();$('currency-error').textContent='获取新汇率失败，当前使用已保存的数据，请留意日期。';}
    else {$('rate-status').textContent='无法获取汇率，请检查网络后重试。';$('currency-error').textContent='汇率服务连接失败，请点击刷新汇率重试。';}
  } finally {loading=false;$('refresh-rates').disabled=false;$('refresh-rates').textContent='刷新汇率 ↻';}
}
try {const cached=JSON.parse(store.get('rates'));if(validRateData(cached)){rates=cached.usd;rateDate=cached.date;rateCached=true;rateStatus();renderConversion();}} catch {}
$('currency-form').addEventListener('submit',event=>{event.preventDefault();renderConversion();});
['currency-from','currency-to'].forEach(id=>$(id).addEventListener('change',renderConversion));
$('amount').addEventListener('input',()=>{if(rates)renderConversion();});
$('swap-currency').addEventListener('click',()=>{const from=$('currency-from').value;$('currency-from').value=$('currency-to').value;$('currency-to').value=from;renderConversion();});
$('refresh-rates').addEventListener('click',loadRates);loadRates();
