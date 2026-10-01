(function (root) {
  'use strict';
  const MAX = 4294967295;
  function ipToNumber(input) {
    const value = String(input).trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) throw new Error('请输入完整的 IPv4 地址，例如 192.168.1.10。');
    const parts = value.split('.').map(Number);
    if (parts.some(n => n > 255)) throw new Error('IP 地址每一段必须在 0–255 之间。');
    return parts.reduce((n, part) => n * 256 + part, 0);
  }
  function numberToIp(n) { return [24,16,8,0].map(shift => Math.floor(n / 2 ** shift) % 256).join('.'); }
  function parsePrefix(input) {
    const value = String(input).trim();
    if (/^\/?\d{1,2}$/.test(value)) {
      const prefix = Number(value.replace('/', ''));
      if (prefix <= 32) return prefix;
    } else if (value.includes('.')) {
      const mask = ipToNumber(value);
      const bits = mask.toString(2).padStart(32, '0');
      if (/^1*0*$/.test(bits)) return bits.indexOf('0') < 0 ? 32 : bits.indexOf('0');
      throw new Error('子网掩码必须由连续的 1 和连续的 0 组成。');
    }
    throw new Error('子网前缀必须为 /0–/32，或有效的子网掩码。');
  }
  function calculateNetwork(ip, mask, gateway = '') {
    const address = ipToNumber(ip), prefix = parsePrefix(mask), size = 2 ** (32 - prefix);
    const network = Math.floor(address / size) * size, last = network + size - 1;
    const firstHost = prefix >= 31 ? network : network + 1;
    const lastHost = prefix >= 31 ? last : last - 1;
    const hosts = prefix >= 31 ? size : size - 2;
    let gatewayNumber = null;
    if (String(gateway).trim()) {
      gatewayNumber = ipToNumber(gateway);
      if (gatewayNumber < firstHost || gatewayNumber > lastHost) throw new Error('网关必须位于当前子网的可用地址范围内。');
      if (gatewayNumber === address) throw new Error('网关不能与当前主机 IP 相同。');
      if (prefix === 32) throw new Error('/32 是单个主机地址，不能在该子网内设置独立网关。');
    }
    const candidates = prefix === 32 ? [] : [...new Set([firstHost,lastHost])].filter(n => n !== address);
    return {address,prefix,size,network,last,mask:MAX-size+1,wildcard:size-1,firstHost,lastHost,hosts,gatewayNumber,candidates,inputUsable:address>=firstHost&&address<=lastHost};
  }
  function splitNetwork(network, prefix, limit = 256) {
    if (!Number.isInteger(prefix) || prefix <= network.prefix || prefix > 32) throw new Error('新前缀必须大于原网络前缀，并且不超过 /32。');
    const count = 2 ** (prefix-network.prefix), size = 2 ** (32-prefix);
    const rows = Array.from({length:Math.min(count,limit)},(_,i)=>calculateNetwork(numberToIp(network.network+i*size),String(prefix)));
    return {count,rows};
  }
  function parseDateTime(value, zone) {
    if (!['utc','sgt'].includes(zone)) throw new Error('请选择有效的输入时区。');
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) throw new Error('请输入完整的日期与时间。');
    const [year,month,day,hour,minute,second] = match.slice(1).map(n=>Number(n||0));
    if (year<1 || month<1 || month>12 || day<1 || day>31 || hour>23 || minute>59 || second>59) throw new Error('日期或时间无效。');
    const local = new Date(0); local.setUTCFullYear(year,month-1,day); local.setUTCHours(hour,minute,second,0);
    if (local.getUTCMonth()!==month-1 || local.getUTCDate()!==day) throw new Error('该月份不存在这个日期。');
    return new Date(local.getTime()-(zone==='sgt'?8*3600000:0));
  }
  function dateParts(date, zone) {
    const shifted = new Date(date.getTime()+(zone==='sgt'?8*3600000:0));
    const pad = n=>String(n).padStart(2,'0');
    return {date:`${String(shifted.getUTCFullYear()).padStart(4,'0')}-${pad(shifted.getUTCMonth()+1)}-${pad(shifted.getUTCDate())}`,time:`${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`};
  }
  function conversion(amount, from, to, rates) {
    if (!Number.isFinite(amount) || amount<0 || amount>1e12) throw new Error('请输入 0–1,000,000,000,000 之间的金额。');
    if (![rates[from],rates[to]].every(n=>Number.isFinite(n)&&n>0)) throw new Error('当前汇率数据不包含所选货币。');
    const rate = rates[to]/rates[from]; return {rate,total:amount*rate};
  }
  const api = {ipToNumber,numberToIp,parsePrefix,calculateNetwork,splitNetwork,parseDateTime,dateParts,conversion};
  root.NetKit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
