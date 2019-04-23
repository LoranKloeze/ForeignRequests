$( function () {
    let origin = null
    var _window
    var refreshTableTimer = -1
    chrome.devtools.inspectedWindow.eval('window.location.origin', (result) => {origin = result})

    var foreignRequests = {}

    const onRequest = (msg) => {
        if (origin === msg.initiator) {
            const originDomain = origin.split('/')[2]
            const regexPattern = '^https?:\/\/[a-zA-Z\d.-]*\.*' + originDomain + '\/'
            const regex = new RegExp(regexPattern)
            if (regex.exec(msg.url) === null) {
                const splittedForeignDomain = msg.url.split('/')[2].split('.')
                const foreignDomain = splittedForeignDomain[splittedForeignDomain.length - 2] +
                    '.' + splittedForeignDomain[splittedForeignDomain.length - 1]


                if (foreignRequests[foreignDomain] === undefined) {
                    foreignRequests[foreignDomain] = {count: 0, lastRequest: -1}
                }

                foreignRequests[foreignDomain]['count']++
                foreignRequests[foreignDomain]['lastRequest'] = Date.now()

            }
        }
    }

    const refreshTable = () => {
        const $tbody = _window.$('#requestsTable tbody')
        $tbody.html('')
        if (Object.entries(foreignRequests).length !== 0) {


            Object.keys(foreignRequests).sort().forEach(function(key) {
                const req = foreignRequests[key]

                const $tr = $('<tr/>')
                $tr.append('<td>' + key + '</td>')
                $tr.append('<td>' + req.count + '</td>')
                $tr.append('<td>' + moment(req.lastRequest).fromNow() + '</td>')
                $tbody.append($tr)
            })
        }

    }

    clearRequests = () => {
        foreignRequests = {}
        refreshTable()
    }

    chrome.devtools.panels.create("Foreign requests",
        "",
        "devtools.html",
        function(extensionPanel) {
            var port = chrome.runtime.connect({name: 'requesttrack'});
            port.onMessage.addListener(function(msg) {
                if (_window) {

                    onRequest(msg);
                }
            });
            extensionPanel.onShown.addListener(function() {
                refreshTableTimer = setInterval(function(){
                    refreshTable()
                }, 1000)
            })

            extensionPanel.onShown.addListener(function tmp(panelWindow) {
                extensionPanel.onShown.removeListener(tmp)
                _window = panelWindow

                panelWindow.$('#btnClearTable').click(clearRequests)
            });

            extensionPanel.onHidden.addListener(function (panelWindow) {
                clearInterval(refreshTableTimer)
            })
        }
    )

    chrome.devtools.network.onNavigated.addListener(function() {
        foreignRequests = {}
        refreshTable()
        chrome.devtools.inspectedWindow.eval('window.location.origin', (result) => {origin = result})
    })
})