const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function createRelay() {
  const saved = new Map();
  const properties = {
    getProperty(key) { return saved.get(key) || null; },
    setProperty(key, value) { saved.set(key, value); }
  };
  const context = {
    PropertiesService: {getScriptProperties: () => properties},
    LockService: {getScriptLock: () => ({waitLock() {}, releaseLock() {}})},
    ContentService: {
      MimeType: {JSON:'json',JAVASCRIPT:'javascript'},
      createTextOutput(body) { return {body,setMimeType() { return this; }}; }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','Code.gs'),'utf8'),context);
  return context;
}

test('scan reaches the room, omits condition, and acknowledges once', () => {
  const relay = createRelay();
  const room = 'Y9FE2V68';
  const id = 'scan-12345678';
  const post = data => JSON.parse(relay.doPost({parameter:{room,...data}}).body);
  const get = data => JSON.parse(relay.doGet({parameter:{room,...data}}).body);

  assert.equal(post({type:'heartbeat'}).ok,true);
  assert.equal(get({after:-1}).displayOnline,true);
  assert.equal(post({type:'scan',id,name:'Abdallah EL Kotabi',role:'Attendee',country:'Egypt',condition:'private'}).ok,true);
  assert.equal(post({type:'scan',id,name:'Abdallah EL Kotabi',role:'Attendee',country:'Egypt'}).ok,true);
  const beforeAck = get({after:0,id});
  assert.equal(beforeAck.events.length,1);
  assert.equal(beforeAck.events[0].name,'Abdallah EL Kotabi');
  assert.equal(Object.hasOwn(beforeAck.events[0],'condition'),false);
  assert.equal(beforeAck.acknowledged,false);
  assert.equal(post({type:'ack',id}).ok,true);
  assert.equal(get({after:-1,id}).acknowledged,true);
});

test('browser relay client reads and posts using the web app protocol', async () => {
  const relay = createRelay();
  const browser = {URL,URLSearchParams,setTimeout,clearTimeout};
  browser.window = browser;
  browser.document = {
    createElement: () => ({remove() {}}),
    head: {appendChild(script) {
      const query = new URL(script.src).searchParams;
      const body = relay.doGet({parameter:Object.fromEntries(query)}).body;
      vm.runInContext(body,browser);
    }}
  };
  browser.fetch = async (_url, options) => {
    const body = relay.doPost({parameter:Object.fromEntries(options.body)});
    assert.equal(JSON.parse(body.body).ok,true);
    return {};
  };
  vm.createContext(browser);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','SummitRelay.js'),'utf8'),browser);

  const room = 'Y9FE2V68';
  const id = 'scan-87654321';
  await browser.SummitRelay.post({type:'heartbeat',room});
  assert.equal((await browser.SummitRelay.read(room)).displayOnline,true);
  await browser.SummitRelay.post({type:'scan',room,id,name:'Test Guest',role:'Speaker',country:'Egypt'});
  const received = await browser.SummitRelay.read(room,0,id);
  assert.equal(received.events[0].name,'Test Guest');
  await browser.SummitRelay.post({type:'ack',room,id});
  assert.equal((await browser.SummitRelay.read(room,-1,id)).acknowledged,true);
});
