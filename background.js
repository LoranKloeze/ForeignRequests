var ports = []
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name !== "requesttrack") return
    ports.push(port)
    port.onDisconnect.addListener(function() {
        var i = ports.indexOf(port)
        if (i !== -1) ports.splice(i, 1)
    })
});
function notifyDevtools(msg) {
    ports.forEach(function(port) {
        port.postMessage(msg)
    })
}

chrome.webRequest.onBeforeRequest.addListener(
    function(d) {
        notifyDevtools(d)
    },
    {urls: ["<all_urls>"]},
    [])