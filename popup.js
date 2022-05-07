function downloadTabUrls() {
  // eslint-disable-next-line
    chrome.tabs.query({}, (tabs) => {
    // prepare urls
    const tabNodes = [];

    for (let i = 0; i < tabs.length; i += 1) {
      tabNodes.push(tabs[i].url);
    }

    // download urls
    const saver = document.createElement('a');
    saver.setAttribute('download', 'tab_urls.txt');
    saver.setAttribute('href', `data:text/plain,${tabNodes.join('\n')}`);

    saver.click();
  });
}

function openTabs() {
  const file = document.getElementById('open_tabs_id').files[0];
  const reader = new FileReader();

  reader.onload = () => {
    // handle errors when not all of data are correct

    const newTabs = reader.result.split('\n');
    for (let i = 0; i < newTabs.length; i += 1) {
      const url = newTabs[i];
      // eslint-disable-next-line
      chrome.tabs.create({ url });
    }
  };
  reader.readAsText(file);

  // reader.onerror?
}

function clickChooseFile() {
  document.getElementById('open_tabs_id').click();
}

document.getElementById('download_id').onclick = downloadTabUrls;
document.getElementById('open_tabs_id').onchange = openTabs;

document.getElementById('file_button_id').onclick = clickChooseFile;
