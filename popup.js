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

async function downloadTabInfo() {
  const allTabInfo = { tabs: [], groups: {} };

  // eslint-disable-next-line
  const tabs = await chrome.tabs.query({});
  
  for (let i = 0; i < tabs.length; ++i) {
    // 1. get tabs info
    const newTab = getTabPropsForSaving(tabs[i]);
    allTabInfo.tabs.push(newTab);
    
    // 2. get groups info
    if (
      newTab.groupId == -1 ||
      Object.prototype.hasOwnProperty.call(allTabInfo.groups, newTab.groupId)
    ) {
      continue;
    }
    const chromeGroup = await chrome.tabGroups.get(newTab.groupId);
    allTabInfo.groups[newTab.groupId] = getGroupPropsForSaving(chromeGroup);
  };

  // download info
  const saver = document.createElement('a');
  saver.setAttribute('download', 'tabs.txt');
  saver.setAttribute('href', `data:text/plain,${JSON.stringify(allTabInfo)}`);

  saver.click();
}

function openTabs() {
  // TODO: show an error in the popup, e.g. when unknown property like "#%$^&*"

  const file = document.getElementById('open_tabs_id').files[0];
  const reader = new FileReader();

  reader.onload = () => {
    // TODO: handle errors when not all of data are correct
    
    const allTabInfo = JSON.parse(reader.result);

    // separate tabs according to their window belongings
    const windowToTabs = allTabInfo.tabs.reduce((acc, tab) => {
      if (!Object.prototype.hasOwnProperty.call(acc, tab.windowId)) {
        acc[tab.windowId] = [];
      }
      acc[tab.windowId].push(tab);

      return acc;
    }, {});

    // 1. open tabs for each window
    const usedGroupIds = {};

    // eslint-disable-next-line
    for (const [_, tabArray] of Object.entries(windowToTabs)) {
      // eslint-disable-next-line
      chrome.windows.create({}, async (newWindow) => {
        for (let i = 0; i < tabArray.length; ++i) {
          const tab = tabArray[i];

          // eslint-disable-next-line
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
                    // join an existing group
                    ? { groupId : usedGroupIds[tab.groupId] }
                    // a new group will be created
                    : { createProperties : { windowId: newWindow.id } }),
            };

            const newGroupId = await chrome.tabs.group(tabGroupProps);
            
            // 3. update group info (color, title, collapsed)
            const groupInfo = allTabInfo.groups[tab.groupId];
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

document.getElementById('download_id').onclick = downloadTabInfo;
document.getElementById('open_tabs_id').onchange = openTabs;

document.getElementById('file_button_id').onclick = () => {
  document.getElementById('open_tabs_id').click();
};

// TODO:
// what's the problem with #? it doesn't save correctly
// https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab

// TODO:
// there is a redundant empty tab in the new window
