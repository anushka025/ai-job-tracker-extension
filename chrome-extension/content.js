// JobTracker Pro - Content Script
// Works with LinkedIn's obfuscated class names using aria-labels

const SUPABASE_URL = 'https://mkraicrlcwvqaycqlnxg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcmFpY3JsY3d2cWF5Y3FsbnhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Mjg1NjEsImV4cCI6MjA4NjAwNDU2MX0.mbsdXNQwcXA641SKeni2rO0NHfzeWtgqOuGfZV5CKoc';

console.log('JobTracker Pro: Content script loaded');

function base64UrlDecodeToString(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
}

function getUserIdFromSupabaseJwt(accessToken) {
  try {
    if (!accessToken) return null;
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    return payload?.sub || null;
  } catch {
    return null;
  }
}

function extractLinkedInJobIdFromUrl(url) {
  if (!url) return null;
  const viewMatch = url.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];
  const currentMatch = url.match(/[?&]currentJobId=(\d+)/);
  if (currentMatch) return currentMatch[1];
  return null;
}

function extractLinkedInJobIdFromCard(jobCard) {
  if (!jobCard) return null;

  const viewLink = jobCard.querySelector('a[href*="/jobs/view/"]');
  const fromViewHref = extractLinkedInJobIdFromUrl(viewLink?.href);
  if (fromViewHref) return fromViewHref;

  const currentLink = jobCard.querySelector('a[href*="currentJobId="]');
  const fromCurrentHref = extractLinkedInJobIdFromUrl(currentLink?.href);
  if (fromCurrentHref) return fromCurrentHref;

  const urnEl = jobCard.querySelector('[data-entity-urn*="jobPosting"]') || jobCard.closest('[data-entity-urn*="jobPosting"]');
  const urn = urnEl?.getAttribute?.('data-entity-urn') || '';
  const urnMatch = urn.match(/jobPosting:(\d+)/);
  if (urnMatch) return urnMatch[1];

  return null;
}

function isJobsPage() {
  const url = window.location.href;
  return url.includes('linkedin.com/jobs');
}

function extractJobDataFromDismissButton(dismissButton) {
  try {
    const ariaLabel = dismissButton.getAttribute('aria-label') || '';
    const jobTitle = ariaLabel.replace('Dismiss ', '').replace(' job', '').trim();
    
    let jobCard = dismissButton;
    for (let i = 0; i < 10; i++) {
      jobCard = jobCard.parentElement;
      if (!jobCard) break;
      const hasJobLink = jobCard.querySelector('a[href*="/jobs/view/"]');
      if (hasJobLink) {
        console.log(`JobTracker Pro: Found job card at level ${i}`);
        break;
      }
    }
    
    if (!jobCard) {
      console.error('JobTracker Pro: No job card found');
      return null;
    }

    const jobLink = jobCard.querySelector('a[href*="/jobs/view/"]');
    let jobId = extractLinkedInJobIdFromCard(jobCard);

    if (!jobId) {
      const urlJobId = extractLinkedInJobIdFromUrl(window.location.href);
      if (urlJobId) {
        console.warn('JobTracker Pro: Using URL fallback for job ID:', urlJobId);
        jobId = urlJobId;
      }
    }

    if (!jobId) {
      console.error('JobTracker Pro: Could not find job ID');
      return null;
    }
    
    const jobData = {
      company_name: 'LinkedIn',
      job_title: jobTitle,
      location: 'Remote',
      job_link: `https://www.linkedin.com/jobs/view/${jobId}`,
      date_applied: new Date().toISOString().split('T')[0],
      status: 'Saved',
      platform: 'LinkedIn',
      notes: `Saved from LinkedIn on ${new Date().toLocaleDateString()}`
    };
    
    console.log('JobTracker Pro: Extracted job data:', jobData);
    return jobData;
    
  } catch (error) {
    console.error('JobTracker Pro: Error extracting job data:', error);
    return null;
  }
}

function createSaveButton() {
  const button = document.createElement('button');
  button.className = 'jobtracker-save-btn';
  button.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
      <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm3 7H9v2H7V9H5V7h2V5h2v2h2v2z"/>
    </svg>
    <span>Save to JobTracker</span>
  `;
  return button;
}

async function handleSaveClick(e, dismissButton) {
  e.preventDefault();
  e.stopPropagation();
  
  const button = e.currentTarget;
  
  button.disabled = true;
  button.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" class="spinning">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M8 2 A6 6 0 0 1 14 8" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
    <span style="font-size: 11px;">Saving...</span>
  `;
  
  try {
    const jobData = extractJobDataFromDismissButton(dismissButton);
    
    if (!jobData) {
      throw new Error('Could not extract job data');
    }
    
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['supabase_token', 'user_id'], resolve);
    });
    
    const supabase_token = result.supabase_token;
    const stored_user_id = result.user_id;
    const jwt_user_id = getUserIdFromSupabaseJwt(supabase_token);
    const user_id = jwt_user_id || stored_user_id;

    if (jwt_user_id && stored_user_id && jwt_user_id !== stored_user_id) {
      console.warn('JobTracker Pro: user_id mismatch between storage and JWT; using JWT user id');
    }
    
    if (!supabase_token || !user_id) {
      button.innerHTML = `<span style="font-size: 10px;">🔓 Opening login...</span>`;
      window.open('http://localhost:3000/login', '_blank');
      
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
            <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm3 7H9v2H7V9H5V7h2V5h2v2h2v2z"/>
          </svg>
          <span>Save to JobTracker</span>
        `;
      }, 2000);
      
      return;
    }

    const normalizedJobLink = (jobData.job_link || '').trim().replace(/\/+$/, '');
    const duplicateCheckUrl =
      `${SUPABASE_URL}/rest/v1/applications` +
      `?or=(job_link.eq.${encodeURIComponent(normalizedJobLink)},job_link.eq.${encodeURIComponent(normalizedJobLink + '/')})` +
      `&select=id&limit=1`;

    console.log('JobTracker Pro: Checking for duplicates...', normalizedJobLink);

    const checkResponse = await fetch(duplicateCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${supabase_token}`
      }
    });

    if (!checkResponse.ok) {
      if (checkResponse.status === 401 || checkResponse.status === 403) {
        console.warn('JobTracker Pro: Auth failed on duplicate check');
        button.innerHTML = `<span style="font-size: 10px;">🔓 Re-login required</span>`;
        window.open('http://localhost:3000/login', '_blank');
        return;
      }
      console.warn('JobTracker Pro: Duplicate check failed', checkResponse.status);
    }

    const existing = checkResponse.ok ? await checkResponse.json() : [];
    if (Array.isArray(existing) && existing.length > 0) {
      button.className = 'jobtracker-save-btn';
      button.innerHTML = `<span style="font-size: 10px;">✓ Already Saved</span>`;
      button.disabled = true;
      return;
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${supabase_token}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        ...jobData,
        user_id: user_id,
        job_link: normalizedJobLink
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save application');
    }
    
    button.className = 'jobtracker-save-btn success';
    button.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
        <path d="M13.5 3.5L6 11 2.5 7.5" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      <span style="font-size: 11px;">Saved!</span>
    `;
    
    setTimeout(() => {
      button.innerHTML = `<span style="font-size: 10px;">✓ In JobTracker</span>`;
    }, 2000);
    
  } catch (error) {
    console.error('JobTracker Pro: Save error:', error);

    const isContextInvalidated =
      (error?.message || '').toLowerCase().includes('context invalidated') ||
      (error?.message || '').toLowerCase().includes('extension context invalidated');

    if (isContextInvalidated) {
      button.className = 'jobtracker-save-btn';
      button.innerHTML = `<span style="font-size: 9px;">🔄 Refresh page</span>`;
      button.disabled = false;
      button.title = 'JobTracker was updated. Refresh this LinkedIn page and try again.';
    } else {
      button.className = 'jobtracker-save-btn error';
      button.innerHTML = `<span style="font-size: 9px;">❌ Error</span>`;

      setTimeout(() => {
        button.disabled = false;
        button.className = 'jobtracker-save-btn';
        button.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
            <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm3 7H9v2H7V9H5V7h2V5h2v2h2v2z"/>
          </svg>
          <span>Save to JobTracker</span>
        `;
      }, 3000);
    }
  }
}

function injectButtons() {
  const dismissButtons = document.querySelectorAll('button[aria-label^="Dismiss"][aria-label$="job"]');
  
  console.log(`JobTracker Pro: Found ${dismissButtons.length} job cards`);
  
  dismissButtons.forEach(dismissButton => {
    const parent = dismissButton.parentElement;
    if (!parent || parent.querySelector('.jobtracker-save-btn')) {
      return;
    }
    
    const saveButton = createSaveButton();
    saveButton.addEventListener('click', (e) => {
      handleSaveClick(e, dismissButton);
    });
    
    parent.appendChild(saveButton);
    console.log('JobTracker Pro: Button injected for', dismissButton.getAttribute('aria-label'));
  });
}

function init() {
  if (!isJobsPage()) {
    console.log('JobTracker Pro: Not a jobs page');
    return;
  }
  
  console.log('JobTracker Pro: Initializing on jobs page');
  
  setTimeout(() => {
    injectButtons();
  }, 2000);
  
  const observer = new MutationObserver(() => {
    injectButtons();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      injectButtons();
    }, 500);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}