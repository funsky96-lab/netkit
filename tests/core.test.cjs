const test = require('node:test');
const assert = require('node:assert/strict');
const k = require('../core.js');
test('IPv4 round trips and rejects malformed addresses', () => {
  for (const value of ['0.0.0.0','255.255.255.255','192.168.1.10','128.0.0.1']) assert.equal(k.numberToIp(k.ipToNumber(value)),value);
  for (const value of ['256.0.0.1','-1.0.0.0','1.2.3','1.2.3.4.5','1e2.1.1.1','1.2.3.a','']) assert.throws(()=>k.ipToNumber(value));
});
test('masks are contiguous and prefix bounds are enforced', () => {
  assert.equal(k.parsePrefix('255.255.255.0'),24);
  assert.equal(k.parsePrefix('0.0.0.0'),0);
  assert.equal(k.parsePrefix('255.255.255.255'),32);
  for (const value of ['255.0.255.0','255.255.255.1','/33','-1','/2x']) assert.throws(()=>k.parsePrefix(value));
});
test('normal subnet ranges and gateway validation', () => {
  const n=k.calculateNetwork('192.168.1.10','/24','192.168.1.1');
  assert.equal(k.numberToIp(n.network),'192.168.1.0');
  assert.equal(k.numberToIp(n.last),'192.168.1.255');
  assert.equal(k.numberToIp(n.firstHost),'192.168.1.1');
  assert.equal(k.numberToIp(n.lastHost),'192.168.1.254');assert.equal(n.hosts,254);
  for (const gateway of ['192.168.2.1','192.168.1.0','192.168.1.255','192.168.1.10']) assert.throws(()=>k.calculateNetwork('192.168.1.10','24',gateway));
  assert.equal(k.calculateNetwork('192.168.1.255','24').inputUsable,false);
});
test('/0, /31 and /32 do not overflow or invent broadcast hosts', () => {
  const all=k.calculateNetwork('255.255.255.254','0');
  assert.equal(all.size,4294967296);assert.equal(all.network,0);assert.equal(all.last,4294967295);assert.equal(all.hosts,4294967294);
  const point=k.calculateNetwork('10.0.0.1','31');assert.equal(point.hosts,2);assert.equal(k.numberToIp(point.firstHost),'10.0.0.0');assert.equal(point.inputUsable,true);
  const host=k.calculateNetwork('255.255.255.255','32');assert.equal(host.hosts,1);assert.equal(host.firstHost,host.lastHost);assert.deepEqual(host.candidates,[]);
});
test('split boundaries stay inside parent and huge outputs are capped', () => {
  const n=k.calculateNetwork('192.168.1.10','24'),s=k.splitNetwork(n,26);
  assert.equal(s.count,4);assert.deepEqual(s.rows.map(r=>k.numberToIp(r.network)),['192.168.1.0','192.168.1.64','192.168.1.128','192.168.1.192']);assert.equal(s.rows[3].last,n.last);
  const big=k.splitNetwork(k.calculateNetwork('0.0.0.0','0'),32);assert.equal(big.count,4294967296);assert.equal(big.rows.length,256);
  assert.throws(()=>k.splitNetwork(n,24));assert.throws(()=>k.splitNetwork(n,33));
});
test('timezone conversion crosses dates and years independently of host timezone', () => {
  assert.deepEqual(k.dateParts(k.parseDateTime('2026-12-31T20:30','utc'),'sgt'),{date:'2027-01-01',time:'04:30:00'});
  assert.deepEqual(k.dateParts(k.parseDateTime('2026-01-01T02:15:03','sgt'),'utc'),{date:'2025-12-31',time:'18:15:03'});
  assert.deepEqual(k.dateParts(k.parseDateTime('2024-02-29T12:00','utc'),'utc'),{date:'2024-02-29',time:'12:00:00'});
  for(const value of ['2025-02-29T12:00','2026-04-31T12:00','2026-01-01T24:00','']) assert.throws(()=>k.parseDateTime(value,'utc'));
});
test('currency cross rates, zero and invalid amounts', () => {
  const rates={usd:1,sgd:1.25,cny:7};
  assert.equal(k.conversion(100,'sgd','cny',rates).total,560);
  assert.equal(k.conversion(0,'usd','sgd',rates).total,0);
  assert.equal(k.conversion(100,'sgd','sgd',rates).total,100);
  for (const amount of [-1,NaN,Infinity,1e13]) assert.throws(()=>k.conversion(amount,'usd','sgd',rates));
  assert.throws(()=>k.conversion(1,'xxx','usd',rates));
});
