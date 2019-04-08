const MockStarQuery = require('../../../lib/model/MockStarQuery').default;

let mockStarQuery = new MockStarQuery();
mockStarQuery.addOne('mockerName1', 'mockModuleName1');
mockStarQuery.addOne('mockerName2', 'mockModuleName2', true);
mockStarQuery.addOne('mockerName3', 'mockModuleName3', true, 1);
mockStarQuery.addOne('mockerName4', 'mockModuleName4', true, { a: 1 });

console.log(mockStarQuery.getCookieString());

//_ms_=%5B%7B%22_ms_name%22%3A%22mockerName1%22%2C%22_ms_target%22%3A%22mockModuleName1%22%2C%22_ms_disable%22%3A0%7D%2C%7B%22_ms_name%22%3A%22mockerName2%22%2C%22_ms_target%22%3A%22mockModuleName2%22%2C%22_ms_disable%22%3A1%7D%2C%7B%22_ms_name%22%3A%22mockerName3%22%2C%22_ms_target%22%3A%22mockModuleName3%22%2C%22_ms_disable%22%3A1%2C%22_ms_extra%22%3A1%7D%2C%7B%22_ms_name%22%3A%22mockerName4%22%2C%22_ms_target%22%3A%22mockModuleName4%22%2C%22_ms_disable%22%3A1%2C%22_ms_extra%22%3A%7B%22a%22%3A1%7D%7D%5D

function setCookie(name, value, validityTime) {
    const exp = new Date();
    exp.setTime(exp.getTime() + validityTime);

    document.cookie = name + '=' + (value || '') + ';expires=' + exp.toGMTString() + ';path=/';
}

setCookie('_ms_', '[{"_ms_name":"mockerName1","_ms_target":"mockModuleName1","_ms_disable":0},{"_ms_name":"mockerName2","_ms_target":"mockModuleName2","_ms_disable":1},{"_ms_name":"mockerName3","_ms_target":"mockModuleName3","_ms_disable":1,"_ms_extra":1},{"_ms_name":"mockerName4","_ms_target":"mockModuleName4","_ms_disable":1,"_ms_extra":{"a":1}}]', 30 * 24 * 60 * 60 * 1000);


