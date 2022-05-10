function getTabPropsForSaving(chromeTab) {
  return {
    groupId: chromeTab.groupId,
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
    const usedGroupIds = {};

    // eslint-disable-next-line
    for (const [_, tabArray] of Object.entries(windowToTabs)) {
      // eslint-disable-next-line
      chrome.windows.create({}, async (newWindow) => {
        for (let i = 0; i < tabArray.length; ++i) {
          const tabObj = tabArray[i];

          // eslint-disable-next-line
          const newTab = await chrome.tabs.create({
            pinned: tabObj.pinned,
            url: tabObj.url,
            windowId: newWindow.id,
          });

          if (tabObj.groupId != -1) {
            const tabGroupProps = {
              tabIds: newTab.id,
              ...(Object.prototype.hasOwnProperty.call(usedGroupIds, tabObj.groupId)
                    // join an existing group
                    ? { groupId : usedGroupIds[tabObj.groupId] }
                    // a new group will be created
                    : { createProperties : { windowId: newWindow.id } }),
            };

            const groupId = await chrome.tabs.group(tabGroupProps);
            usedGroupIds[tabObj.groupId] = groupId;
          }
        };
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
