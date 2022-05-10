function getTabPropsForSaving(chromeTab) {
  return {
    groupId: chromeTab.groupId,
    pinned: chromeTab.pinned,
    url: chromeTab.url,
    windowId: chromeTab.windowId,
  };
}
function getGroupPropsForSaving(group) {
  return {
    collapsed: group.collapsed,
    color: group.color,
    title: group.title,
  };
}

async function getDataForSaving(tabs) {
  const allTabData = { tabs: [], groups: {} };

  for (let i = 0; i < tabs.length; ++i) {
    // get tabs data
    const newTab = getTabPropsForSaving(tabs[i]);
    allTabData.tabs.push(newTab);
    
    // get groups data
    if (
      newTab.groupId == -1 ||
      Object.prototype.hasOwnProperty.call(allTabData.groups, newTab.groupId)
    ) {
      continue;
    }
    const chromeGroup = await chrome.tabGroups.get(newTab.groupId);
    allTabData.groups[newTab.groupId] = getGroupPropsForSaving(chromeGroup);
  };

  return allTabData;
}

async function downloadTabData() {
  // prepare data
  const tabs = await chrome.tabs.query({});
  const allTabData = await getDataForSaving(tabs);

  // download data
  const saver = document.createElement('a');
  saver.setAttribute('download', 'tabs.txt');
  saver.setAttribute('href', `data:text/plain,${encodeURIComponent(JSON.stringify(allTabData))}`);
  saver.click();
}

function openTabs() {
  // TODO: show an error in the popup, e.g. when unknown property like "#%$^&*"

  const file = document.getElementById('open_tabs_id').files[0];
  const reader = new FileReader();

  reader.onload = () => {
    // TODO: handle errors when not all of data are correct
    
    const allTabData = JSON.parse(decodeURIComponent(reader.result));

    // separate tabs according to their window belongings
    const windowToTabs = allTabData.tabs.reduce((acc, tab) => {
      if (!Object.prototype.hasOwnProperty.call(acc, tab.windowId)) {
        acc[tab.windowId] = [];
      }
      acc[tab.windowId].push(tab);

      return acc;
    }, {});

    // 1. open tabs for each window
    const usedGroupIds = {};

    for (const [_, tabArray] of Object.entries(windowToTabs)) {
      chrome.windows.create({}, async (newWindow) => {
        for (let i = 0; i < tabArray.length; ++i) {
          const tab = tabArray[i];

          const newTab = await chrome.tabs.create({
            pinned: tab.pinned,
            url: tab.url,
            windowId: newWindow.id,
          });

          // 2. add the tab to a group
          if (tab.groupId != -1) {
            const tabGroupProps = {
              tabIds: newTab.id,
              ...(Object.prototype.hasOwnProperty.call(usedGroupIds, tab.groupId)
                    ? { groupId : usedGroupIds[tab.groupId] }             // join an existing group
                    : { createProperties : { windowId: newWindow.id } }), // a new group will be created
            };

            const newGroupId = await chrome.tabs.group(tabGroupProps);
            
            // 3. update group info (color, title, collapsed)
            const groupInfo = allTabData.groups[tab.groupId];
            chrome.tabGroups.update(newGroupId, groupInfo);
            
            usedGroupIds[tab.groupId] = newGroupId;
          }
        };
      });
    }
  };

  reader.readAsText(file);

  // TODO: reader.onerror
}

document.getElementById('download_id').onclick = downloadTabData;
document.getElementById('open_tabs_id').onchange = openTabs;

document.getElementById('file_button_id').onclick = () => {
  document.getElementById('open_tabs_id').click();
};

// TODO:
// there is a redundant empty tab in the new window

// TODO:
// - move the logic of reading and writing the json
// - beautiful structure in .txt

// TODO:
// error: activating a tab that is inside a collapsed group
