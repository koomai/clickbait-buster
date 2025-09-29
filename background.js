// background.js

// This event is fired when the extension is first installed.
chrome.runtime.onInstalled.addListener(() => {
    // Create an alarm to clear the cache every 7 days.
    // The 'periodInMinutes' is set to a large number of minutes (7 days * 24 hours * 60 minutes)
    // Note: Chrome limits alarms to at least once every minute, but we need 7 days.
    // Setting a custom name allows us to identify and manage this specific alarm.
    chrome.alarms.create('clearCacheAlarm', {
        periodInMinutes: 7 * 24 * 60
    });
    console.log("ClickbaitBuster: Cache clearing alarm set for every 7 days.");
});

// This listener is triggered when the alarm fires.
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'clearCacheAlarm') {
        console.log("ClickbaitBuster: Clearing cache due to alarm.");
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                console.error("ClickbaitBuster: Error clearing storage:", chrome.runtime.lastError);
            } else {
                console.log("ClickbaitBuster: Local storage cache cleared successfully.");
            }
        });
    }
});
