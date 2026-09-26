export interface DodoCheckoutOptions {
  productId: string;
  onSuccess?: (payload: { sessionId: string }) => void;
  onClose?: (payload: { reason: string }) => void;
  onError?: (payload: { code: string; message: string }) => void;
}

export const DodoCheckout = {
  open: (options: DodoCheckoutOptions) => {
    // Prevent multiple checkouts from opening
    if (document.getElementById('dodo-checkout-wrapper')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'dodo-checkout-wrapper';
    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      opacity: '0',
      transition: 'opacity 0.3s ease',
    });

    // Add a loading spinner
    const loader = document.createElement('div');
    loader.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    Object.assign(loader.style, {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'spin 1s linear infinite'
    });
    
    // Add simple spin animation to head if not exists
    if (!document.getElementById('dodo-styles')) {
      const style = document.createElement('style');
      style.id = 'dodo-styles';
      style.textContent = '@keyframes spin { 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    const iframe = document.createElement('iframe');
    const checkoutUrl = 'http://localhost:5173';
    
    iframe.src = `${checkoutUrl}?productId=${encodeURIComponent(options.productId)}`;
    Object.assign(iframe.style, {
      width: '100%',
      maxWidth: '420px',
      height: '100%',
      maxHeight: '680px',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transform: 'scale(0.95)',
      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      backgroundColor: 'transparent',
      opacity: '0', // Hide iframe initially
      position: 'relative',
      zIndex: '2'
    });

    wrapper.appendChild(loader);
    wrapper.appendChild(iframe);
    document.body.appendChild(wrapper);
    document.body.style.overflow = 'hidden';

    // Animate in wrapper
    requestAnimationFrame(() => {
      wrapper.style.opacity = '1';
    });

    // Timeout if iframe takes too long to load
    const loadTimeout = setTimeout(() => {
      options.onError?.({ code: 'load_timeout', message: 'Checkout failed to load. Please try again.' });
      closeCheckout('load_timeout');
    }, 10000);

    const closeCheckout = (reason: string) => {
      wrapper.style.opacity = '0';
      iframe.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
        document.body.style.overflow = '';
        window.removeEventListener('message', handleMessage);
      }, 300);
      options.onClose?.({ reason });
    };

    const handleMessage = (event: MessageEvent) => {
      // Validate origin in production
      // if (event.origin !== 'https://checkout.dodopayments.com') return;

      const { type, payload } = event.data;

      if (type === 'DODO_READY') {
        clearTimeout(loadTimeout);
        if (wrapper.contains(loader)) {
          wrapper.removeChild(loader);
        }
        iframe.style.opacity = '1';
        iframe.style.transform = 'scale(1)';
      } else if (type === 'DODO_CLOSE') {
        closeCheckout('user_closed');
      } else if (type === 'DODO_SUCCESS') {
        options.onSuccess?.({ sessionId: payload.sessionId });
        setTimeout(() => closeCheckout('success'), 2000); // Close after showing success state
      } else if (type === 'DODO_ERROR') {
        options.onError?.({ code: payload.code, message: payload.message });
        // Don't close immediately on error, let the user retry inside the iframe
      }
    };

    window.addEventListener('message', handleMessage);

    // Optional: click outside to close
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper) {
        closeCheckout('clicked_outside');
      }
    });
  },
};
