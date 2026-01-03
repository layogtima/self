// ========================================
// MOONFALL E-READER
// Interactive story reader with page navigation
// ========================================

// Load the story from moonfall.md
let storyMarkdown = '';

// Fetch the markdown file
fetch('moonfall.md')
    .then(response => response.text())
    .then(data => {
        storyMarkdown = data;
        initializeReader();
    })
    .catch(error => {
        console.error('Error loading story:', error);
        document.getElementById('content').innerHTML = '<p>Error loading story. Please refresh the page.</p>';
    });

// ========================================
// EXTENSION FOR CUSTOM BLOCKS
// ========================================
// Using default parsing as we handled blocks with HTML in markdown directly

// ========================================
// PAGE SPLITTING LOGIC
// ========================================

function splitIntoPages(markdown) {
    const html = marked.parse(markdown);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get all content elements
    const elements = Array.from(tempDiv.querySelectorAll('h1, h2, h3, p, hr, div, ul, ol, blockquote'));
    const pages = [];
    let currentPage = [];
    let currentLength = 0;
    
    // Responsive page length based on viewport
    const isMobile = window.innerWidth < 768;
    const maxLength = isMobile ? 2500 : 3500;

    elements.forEach((element) => {
        // Skip elements internal to other elements we already grabbed
        // (A bit simplified, but our markdown structure is flat enough for this)
        if (element.parentElement !== tempDiv) return;

        const text = element.textContent || '';
        const isPageBreak = element.style.pageBreakAfter === 'always';
        
        // Force page break on page-break-after elements
        if (isPageBreak && currentPage.length > 0) {
            pages.push(currentPage.join(''));
            currentPage = [];
            currentLength = 0;
            return;
        }
        
        // Start new page if we exceed max length
        if (currentLength + text.length > maxLength && currentPage.length > 0) {
            pages.push(currentPage.join(''));
            currentPage = [];
            currentLength = 0;
        }

        currentPage.push(element.outerHTML);
        currentLength += text.length;
    });

    // Add remaining content as final page
    if (currentPage.length > 0) {
        pages.push(currentPage.join(''));
    }

    return pages;
}

// ========================================
// READER STATE
// ========================================

let currentPage = 0;
let pages = [];
let contentEl, progressEl, prevBtn, nextBtn, pageIndicatorsContainer, headerTitleEl;

// ========================================
// INITIALIZATION
// ========================================

function initializeReader() {
    // Split content into pages
    pages = splitIntoPages(storyMarkdown);
    
    // Get DOM elements
    contentEl = document.getElementById('content');
    progressEl = document.getElementById('progress');
    headerTitleEl = document.getElementById('headerTitle');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    pageIndicatorsContainer = document.getElementById('pageIndicators');
    
    // Create page indicators dynamically
    createPageIndicators();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load state from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    
    if (pageParam && parseInt(pageParam) > 0 && parseInt(pageParam) <= pages.length) {
         currentPage = parseInt(pageParam) - 1;
    } else {
        const savedPage = localStorage.getItem('moonfall-current-page');
        if (savedPage && parseInt(savedPage) < pages.length) {
            currentPage = parseInt(savedPage);
        }
    }
    
    // Render initial page
    renderPage();
}

// ========================================
// PAGE INDICATORS
// ========================================

function createPageIndicators() {
    pageIndicatorsContainer.innerHTML = '';
    
    // Limit indicators to prevent overflow
    const maxIndicators = window.innerWidth < 640 ? 5 : 10;
    const showIndicators = Math.min(pages.length, maxIndicators);
    
    for (let i = 0; i < showIndicators; i++) {
        const indicator = document.createElement('button');
        indicator.className = 'page-indicator inactive';
        indicator.setAttribute('aria-label', `Go to page ${i + 1}`);
        indicator.addEventListener('click', () => goToPage(i));
        pageIndicatorsContainer.appendChild(indicator);
    }
}

// ========================================
// CHAPTER DETECTION
// ========================================

function getCurrentChapterTitle() {
    if (currentPage === 0) return "MOONFALL"; // Title page

    // Create a temp element to parse previous pages to find the last H1
    // Iterate backwards from current page to 0
    for (let i = currentPage; i >= 0; i--) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = pages[i];
        const h1 = tempDiv.querySelector('h1');
        if (h1) {
            // Extract just the chapter name after the colon
            const text = h1.textContent;
            const colonIndex = text.indexOf(':');
            if (colonIndex !== -1) {
                return text.substring(colonIndex + 1).trim();
            }
            return text;
        }
    }
    
    return "MOONFALL";
}

// ========================================
// RENDERING
// ========================================

function renderPage() {
    // Remove animation class
    contentEl.classList.remove('page-fade');
    
    // Trigger reflow to restart animation
    void contentEl.offsetWidth;
    
    // Add animation class
    contentEl.classList.add('page-fade');
    
    // Update content
    contentEl.innerHTML = pages[currentPage];
    
    // Update header info
    progressEl.textContent = `${currentPage + 1} / ${pages.length}`;
    headerTitleEl.textContent = getCurrentChapterTitle();
    
    // Update navigation buttons
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === pages.length - 1;
    
    // Update page indicators
    updatePageIndicators();
    
    // Save current position
    localStorage.setItem('moonfall-current-page', currentPage);
    
    // Update URL without reloading
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('page', currentPage + 1);
    window.history.replaceState({ page: currentPage + 1 }, '', newUrl);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePageIndicators() {
    const indicators = pageIndicatorsContainer.querySelectorAll('.page-indicator');
    const maxIndicators = indicators.length;
    
    // Calculate which pages to show in indicators
    let startPage = 0;
    if (pages.length > maxIndicators) {
        startPage = Math.max(0, Math.min(
            currentPage - Math.floor(maxIndicators / 2),
            pages.length - maxIndicators
        ));
    }
    
    indicators.forEach((indicator, idx) => {
        const pageIdx = startPage + idx;
        const isActive = pageIdx === currentPage;
        
        indicator.classList.toggle('active', isActive);
        indicator.classList.toggle('inactive', !isActive);
        indicator.setAttribute('aria-current', isActive ? 'page' : 'false');
        
        // Update click handler to point to correct page since we might be offsetting
        indicator.onclick = () => goToPage(pageIdx);
    });
}

// ========================================
// NAVIGATION
// ========================================

function goToPage(pageNum) {
    if (pageNum >= 0 && pageNum < pages.length) {
        currentPage = pageNum;
        renderPage();
    }
}

function nextPage() {
    if (currentPage < pages.length - 1) {
        currentPage++;
        renderPage();
    }
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        renderPage();
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Button navigation
    prevBtn.addEventListener('click', prevPage);
    nextBtn.addEventListener('click', nextPage);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'h') {
            prevPage();
        } else if (e.key === 'ArrowRight' || e.key === 'l') {
            nextPage();
        } else if (e.key === 'Home') {
            goToPage(0);
        } else if (e.key === 'End') {
            goToPage(pages.length - 1);
        }
    });
    
    // Touch gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    contentEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    contentEl.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next page
                nextPage();
            } else {
                // Swipe right - previous page
                prevPage();
            }
        }
    }
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-split pages on significant resize
            const newPages = splitIntoPages(storyMarkdown);
            if (newPages.length !== pages.length) {
                pages = newPages;
                createPageIndicators();
                // Adjust current page if needed
                if (currentPage >= pages.length) {
                    currentPage = pages.length - 1;
                }
                renderPage();
            }
        }, 300);
    });
    
    // Handle browser back button
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            currentPage = e.state.page - 1;
            renderPage();
        }
    });
    
    // Handle chapter menu clicks
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#chapter-')) {
            e.preventDefault();
            const chapterNum = parseInt(e.target.getAttribute('href').replace('#chapter-', ''));
            
            // Find the page that contains this chapter
            for (let i = 0; i < pages.length; i++) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = pages[i];
                const h1 = tempDiv.querySelector('h1');
                if (h1) {
                    const text = h1.textContent;
                    // Check if this is the chapter we're looking for
                    if (text.includes(`CHAPTER ${['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][chapterNum - 1]}`)) {
                        goToPage(i);
                        break;
                    }
                }
            }
        }
    });
}

// ========================================
// READING PROGRESS TRACKING
// ========================================

// Track reading time
let readingStartTime = Date.now();
window.addEventListener('beforeunload', () => {
    const readingTime = Math.floor((Date.now() - readingStartTime) / 1000);
    const totalTime = parseInt(localStorage.getItem('moonfall-reading-time') || '0');
    localStorage.setItem('moonfall-reading-time', totalTime + readingTime);
});
