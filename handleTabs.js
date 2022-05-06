function uploadTabs() {
    var file = document.getElementById('upload_tabs_id').files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
        // не все правильные будут -> handle errors

        const new_tabs = reader.result.split('\n');
        for (let i = 0; i < new_tabs.length; ++i) {
            let url = new_tabs[i];
            chrome.tabs.create({ url });
        }
    }
    reader.readAsText(file);

    // reader.onerror?
}

function downloadTabs() {
    chrome.tabs.query({}, function (tabs) {
        // prepare urls
        let tab_nodes = []

        for (let i = 0; i < tabs.length; ++i) {
            tab_nodes.push(tabs[i].url)
        }

        // download urls
        let saver = document.createElement('a');
        saver.setAttribute('download', 'tab_urls.txt')
        saver.setAttribute('href', `data:text/plain,${tab_nodes.join('\n')}`)

        saver.click();
    });

}

document.getElementById('download_tabs_id').onclick = downloadTabs;
document.getElementById('upload_tabs_id').onchange = uploadTabs;

// 'permissions': ['storage', 'activeTab', 'scripting', 'tabs'],
