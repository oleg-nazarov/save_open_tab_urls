function getTabPropsForSaving(chromeTab) {
  return {
    // groupId: chromeTab.groupId, TODO: next feature
    pinned: chromeTab.pinned,
    url: chromeTab.url,
    windowId: chromeTab.windowId,
  };
}

function downloadUrls() {
  // eslint-disable-next-line
  chrome.tabs.query({}, (tabs) => {
    // prepare urls
    const urlArray = tabs.map((chromeTab) => {
      const tab = getTabPropsForSaving(chromeTab);
      return JSON.stringify(tab);
    });

    // download urls
    const saver = document.createElement('a');
    saver.setAttribute('download', 'tab_urls.txt');
    saver.setAttribute('href', `data:text/plain,${urlArray.join('\n')}`);

    saver.click();
  });
}

function openTabs() {
  // TODO: show an error in the popup, e.g. when unknown property like "#%$^&*"

  const file = document.getElementById('open_tabs_id').files[0];
  const reader = new FileReader();

  reader.onload = () => {
    // handle errors when not all of data are correct

    // separate tabs according to their window belongings
    const windowToTabs = reader.result.split('\n').reduce((acc, tabString) => {
      const tabObj = JSON.parse(tabString);

      if (!Object.prototype.hasOwnProperty.call(acc, tabObj.windowId)) {
        acc[tabObj.windowId] = [];
      }
      acc[tabObj.windowId].push(tabObj);

      return acc;
    }, {});

    // open tabs for each window
    // eslint-disable-next-line
    for (const [_, tabArray] of Object.entries(windowToTabs)) {
      // eslint-disable-next-line
      chrome.windows.create({}, (newWindow) => {
        tabArray.forEach((tabObj) => {
          // eslint-disable-next-line
          chrome.tabs.create({ ...tabObj, windowId: newWindow.id });
        });
      });
    }
  };

  reader.readAsText(file);

  // TODO: reader.onerror
}

document.getElementById('download_id').onclick = downloadUrls;
document.getElementById('open_tabs_id').onchange = openTabs;

document.getElementById('file_button_id').onclick = () => {
  document.getElementById('open_tabs_id').click();
};

// TODO:
// what's the problem with #? it doesn't save correctly
// https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab

// TODO:
// there is a redundant empty tab in the new window
