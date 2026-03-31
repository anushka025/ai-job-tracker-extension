/* global chrome */
import { useEffect } from 'react';

function TestExtension() {
  useEffect(() => {
    console.log('🧪 Testing extension communication...');
    
    // Test 1: Check if chrome.runtime exists
    console.log('chrome.runtime available?', window.chrome?.runtime ? 'YES ✅' : 'NO ❌');
    
    // Test 2: Try postMessage (always works)
    window.postMessage({ 
      type: 'JOBTRACKER_TEST', 
      message: 'Hello from web app!' 
    }, '*');
    
    console.log('✅ Sent postMessage');
    
    // Test 3: Try chrome.runtime.sendMessage if available
    if (window.chrome?.runtime) {
      try {
        chrome.runtime.sendMessage(
          'gkobemhjaceoaldfcngmgiabmnnilici',
          { type: 'TEST', message: 'Hello via chrome.runtime' },
          (response) => {
            console.log('chrome.runtime response:', response);
          }
        );
        console.log('✅ Sent chrome.runtime.sendMessage');
      } catch (err) {
        console.log('❌ chrome.runtime.sendMessage failed:', err.message);
      }
    }
    
  }, []);
  
  return (
    <div style={{padding: '40px', textAlign: 'center', fontFamily: 'sans-serif'}}>
      <h1>🧪 Testing Extension Connection</h1>
      <p>Check the console for results!</p>
      <div style={{marginTop: '20px', padding: '20px', background: '#f0f0f0', borderRadius: '8px'}}>
        <p><strong>What to check:</strong></p>
        <ol style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
          <li>Open Console (F12)</li>
          <li>Look for test messages</li>
          <li>Check if extension responded</li>
        </ol>
      </div>
    </div>
  );
}

export default TestExtension;