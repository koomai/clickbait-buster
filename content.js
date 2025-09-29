// content.js - This script runs on news.com.au
console.log("ClickbaitBuster: Content script loaded with caching.");

const API_KEY_STORAGE_KEY = 'geminiApiKey';
const ENABLE_TOGGLE_KEY = 'clickbaitBusterEnabled';
const PROCESSED_ATTRIBUTE = 'data-de-clickbaited';
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

let geminiApiKey;
let isEnabled = false;

// Load settings from storage
function loadSettings() {
    chrome.storage.local.get([API_KEY_STORAGE_KEY, ENABLE_TOGGLE_KEY], function(result) {
        geminiApiKey = result[API_KEY_STORAGE_KEY];
        isEnabled = result[ENABLE_TOGGLE_KEY] || false;

        if (!geminiApiKey) {
            console.error("ClickbaitBuster: API key not found. Please set it in the extension popup.");
            return;
        }

        if (!isEnabled) {
            console.log("ClickbaitBuster: Extension is disabled. Enable it in the popup to start processing articles.");
            return;
        }

        console.log("ClickbaitBuster: Settings loaded and extension enabled. Starting to observe articles.");
        initializeObserver();
    });
}

// Generate a unique cache key for an article based on its link
function getCacheKey(articleLink) {
    // Using a hash of the URL to ensure the key is a valid storage key
    // This also keeps the key from being too long
    return `cache_${btoa(articleLink)}`;
}

function processArticle(articleElement) {
    // Check if extension is enabled before processing
    if (!isEnabled) {
        console.log("ClickbaitBuster: Extension is disabled, skipping article processing.");
        return;
    }

    const titleElement = articleElement.querySelector('.storyblock_title_link');
    const summaryElement = articleElement.querySelector('.storyblock_standfirst_link');

    if (!titleElement) {
        console.warn("ClickbaitBuster: Could not find title element for article.", articleElement);
        return;
    }

    const hasSummary = !!summaryElement;

    const originalTitle = titleElement.textContent;
    const originalSummary = hasSummary ? summaryElement.textContent : '';
    const articleLink = titleElement.href;
    const cacheKey = getCacheKey(articleLink);

    // Check cache first
    chrome.storage.local.get([cacheKey], function(cachedData) {
        if (cachedData[cacheKey]) {
            console.log(`ClickbaitBuster: Found cached version for "${originalTitle}".`);
            const result = cachedData[cacheKey];
            titleElement.textContent = result.newHeadline;
            if (hasSummary) {
                summaryElement.textContent = result.newSummary;
            }
            articleElement.setAttribute(PROCESSED_ATTRIBUTE, 'true');
        } else {
            // No cache, proceed with API call
            
            // Immediately replace with placeholder text
            titleElement.textContent = "Rewriting headline...";
            if (hasSummary) {
                summaryElement.textContent = "Rewriting summary...";
            }

            console.log(`ClickbaitBuster: Processing article - "${originalTitle}"`);

            const payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": `
                                Rewrite the following news headline and summary to be informative and non-clickbait. The new headline and summary should reveal what the story is about.
                                
                                Original Headline: "${originalTitle}"
                                Original Summary: "${originalSummary}"
                                Article Link: "${articleLink}"

                                Crucially, ensure you mention key name(s) and key facts from the story in the new headline and summary, especially something deliberately hidden in the original headline/summary for clickbait purposes. E.g. 'Queenslander' becomes senator for NSW should be Ex-Hanson PA Sean Bell becomes senator for NSW.
                                The new headline should have a word count close to the original headline.
                                The new summary should have a word count close to the original summary.

                                Format the response as a JSON object with 'newHeadline' and 'newSummary' keys.
                                `
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "OBJECT",
                        "properties": {
                            "newHeadline": { "type": "STRING" },
                            "newSummary": { "type": "STRING" }
                        }
                    }
                }
            };

            fetch(`${API_URL}?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    console.error(`ClickbaitBuster: API response error - ${response.status}`);
                    return response.json().then(err => {
                        // On error, revert to original text
                        titleElement.textContent = originalTitle;
                        if (hasSummary) {
                            summaryElement.textContent = originalSummary;
                        }
                        throw new Error(JSON.stringify(err));
                    });
                }
                return response.json();
            })
            .then(data => {
                const rawText = data.candidates[0].content.parts[0].text;
                
                // Use a regex to extract the JSON string, accounting for potential markdown wrappers
                const jsonMatch = rawText.match(/```json\n([\s\S]*)\n```/);
                let jsonString;
        
                if (jsonMatch && jsonMatch[1]) {
                    jsonString = jsonMatch[1];
                } else {
                    // Fallback: assume the entire response is the JSON string
                    jsonString = rawText;
                }
        
                let result;
                try {
                    result = JSON.parse(jsonString);
                } catch (e) {
                    console.error("ClickbaitBuster: Error parsing JSON from API response:", e, "Raw Text:", rawText);
                    // Revert to original text on malformed JSON
                    titleElement.textContent = originalTitle;
                    if (hasSummary) {
                        summaryElement.textContent = originalSummary;
                    }
                    return;
                }
                
                if (result.newHeadline) {
                    titleElement.textContent = result.newHeadline;
                    if (hasSummary && result.newSummary) {
                        summaryElement.textContent = result.newSummary;
                    } else if (hasSummary) {
                        // If the API didn't return a new summary, revert to original.
                        summaryElement.textContent = originalSummary;
                    }
                    articleElement.setAttribute(PROCESSED_ATTRIBUTE, 'true');
                    
                    // Cache the rewritten content
                    chrome.storage.local.set({ [cacheKey]: result }, function() {
                        console.log(`ClickbaitBuster: Rewrote and cached headline for "${originalTitle}"`);
                    });
                } else {
                    console.error("ClickbaitBuster: Malformed JSON structure. Missing keys.", result);
                     // Revert to original text on malformed JSON
                    titleElement.textContent = originalTitle;
                    if (hasSummary) {
                        summaryElement.textContent = originalSummary;
                    }
                }
            })
            .catch(error => {
                console.error("ClickbaitBuster: Error calling Gemini API:", error);
                 // Revert to original text on any API error
                titleElement.textContent = originalTitle;
                if (hasSummary) {
                    summaryElement.textContent = originalSummary;
                }
            });
        }
    });
}

let observer = null;

function createObserver() {
    return new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const article = entry.target;
                if (article.getAttribute(PROCESSED_ATTRIBUTE) !== 'true') {
                    processArticle(article);
                }
                observer.unobserve(article);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });
}

function initializeObserver() {
    if (!isEnabled) {
        console.log("ClickbaitBuster: Observer not initialized - extension is disabled");
        return;
    }

    // Clean up existing observer if it exists
    if (observer) {
        observer.disconnect();
    }

    observer = createObserver();
    const articles = document.querySelectorAll('article.storyblock');
    articles.forEach(article => {
        observer.observe(article);
    });
    console.log(`ClickbaitBuster: Observer initialized and watching ${articles.length} articles`);
}

function stopObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
        console.log("ClickbaitBuster: Observer stopped and disconnected");
    }
}

// Listen for storage changes to update settings in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes[ENABLE_TOGGLE_KEY]) {
            const wasEnabled = isEnabled;
            isEnabled = changes[ENABLE_TOGGLE_KEY].newValue || false;
            console.log(`ClickbaitBuster: Toggle state changed to ${isEnabled ? 'enabled' : 'disabled'}`);

            if (isEnabled && !wasEnabled) {
                // Just enabled - start observing if we have an API key
                if (geminiApiKey) {
                    initializeObserver();
                }
            } else if (!isEnabled && wasEnabled) {
                // Just disabled - stop observing
                stopObserver();
            }
        }

        if (changes[API_KEY_STORAGE_KEY]) {
            geminiApiKey = changes[API_KEY_STORAGE_KEY].newValue;
            console.log("ClickbaitBuster: API key updated");

            // If we have both API key and enabled state, initialize observer
            if (geminiApiKey && isEnabled) {
                initializeObserver();
            }
        }
    }
});

// Start the process
loadSettings();
