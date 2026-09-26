import { DodoCheckout } from '../../sdk/src/index';

const logContainer = document.getElementById('log-container')!;
const buyBtn = document.getElementById('buy-btn')!;

function addLog(event: string, data: any) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  
  const time = new Date().toLocaleTimeString();
  
  entry.innerHTML = `
    <span class="log-time">${time} - ${event}</span>
    <div><pre style="margin: 4px 0; color: #fff;">${JSON.stringify(data, null, 2)}</pre></div>
  `;
  
  logContainer.prepend(entry);
}

buyBtn.addEventListener('click', () => {
  addLog('CHECKOUT_OPENED', { productId: 'prod_123' });
  
  DodoCheckout.open({
    productId: 'prod_123',
    onSuccess: (payload) => {
      addLog('ON_SUCCESS', payload);
    },
    onClose: (payload) => {
      addLog('ON_CLOSE', payload);
    },
    onError: (payload) => {
      addLog('ON_ERROR', payload);
    }
  });
});
