chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidepanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.windowId) {
        const windowId = tabs[0].windowId;
        chrome.sidePanel.open({ windowId });
      }
    });
  }
})

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

export {} 