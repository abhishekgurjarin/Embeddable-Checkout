import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, Loader2, X, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

type PaymentState = 'idle' | 'loading' | 'success' | 'error';

function App() {
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Send ready event to parent to dismiss loader
  useEffect(() => {
    window.parent.postMessage({ type: 'DODO_READY' }, '*');
  }, []);

  // Parse product info from URL
  const searchParams = new URLSearchParams(window.location.search);
  const productId = searchParams.get('productId') || 'prod_unknown';
  
  // Close handler
  const handleClose = () => {
    window.parent.postMessage({ type: 'DODO_CLOSE', payload: {} }, '*');
  };

  const handleSuccess = (sessionId: string) => {
    setPaymentState('success');
    window.parent.postMessage({ type: 'DODO_SUCCESS', payload: { sessionId } }, '*');
  };

  const handleError = (code: string, message: string) => {
    setPaymentState('error');
    setErrorMessage(message);
    window.parent.postMessage({ type: 'DODO_ERROR', payload: { code, message } }, '*');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (paymentState === 'loading' || paymentState === 'success') return;
    
    setPaymentState('loading');
    setErrorMessage('');

    // Fake API call
    setTimeout(() => {
      const sanitizedCard = cardNumber.replace(/\s+/g, '');
      
      if (sanitizedCard === '4242424242424242') {
        handleSuccess('sess_' + Math.random().toString(36).substring(7));
      } else if (sanitizedCard === '4000000000000002') {
        handleError('card_declined', 'Your card was declined. Please try a different payment method.');
      } else if (sanitizedCard === '4000000000000341') {
        if (retryCount === 0) {
          setRetryCount(1);
          handleError('network_error', 'Connection dropped. Please try again.');
        } else {
          handleSuccess('sess_' + Math.random().toString(36).substring(7));
        }
      } else {
        handleError('invalid_card', 'Invalid card details. Try the test cards.');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Dodo Payments</h2>
              <p className="text-xs text-gray-500 font-medium">{productId === 'prod_123' ? 'Premium Plan' : productId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">$29.00</div>
            </div>
            <button 
              onClick={handleClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success State */}
        {paymentState === 'success' ? (
          <div className="p-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[320px]">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment successful!</h3>
            <p className="text-sm text-gray-500">Thank you for your purchase. A receipt has been sent to {email || 'your email'}.</p>
            <p className="text-xs text-gray-400 mt-6">This window will close automatically.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Error Message */}
            {paymentState === 'error' && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="leading-tight">{errorMessage}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow placeholder-gray-400"
                disabled={paymentState === 'loading'}
              />
            </div>

            {/* Card Information */}
            <div className="space-y-1.5">
              <label htmlFor="card" className="text-sm font-medium text-gray-700">Card information</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="card"
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-t-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow placeholder-gray-400 z-10 relative"
                  disabled={paymentState === 'loading'}
                />
                <div className="flex -mt-px relative z-0">
                  <div className="w-1/2 min-w-0">
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-bl-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow placeholder-gray-400"
                      disabled={paymentState === 'loading'}
                    />
                  </div>
                  <div className="w-1/2 min-w-0 -ml-px">
                    <input
                      type="text"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                      placeholder="CVC"
                      maxLength={4}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-br-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow placeholder-gray-400"
                      disabled={paymentState === 'loading'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={paymentState === 'loading'}
              className="mt-2 w-full bg-black text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center h-[46px]"
            >
              {paymentState === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Pay $29.00`
              )}
            </button>
            
            <p className="text-center text-xs text-gray-500 font-medium">
              Powered by Dodo Payments
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
