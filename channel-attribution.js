/* Campaign links keep the UTM query intact for Clarity's built-in filters. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var source = (params.get('utm_source') || '').toLowerCase();
  var channel = source === 'threads' ? 'threads' : /^(instagram|insta)$/.test(source) ? 'instagram' : '';
  // Referrers help when a visitor shares the root URL instead of a campaign link.
  if (!channel && !source && document.referrer) {
    try {
      var host = new URL(document.referrer).hostname;
      if (/(^|\.)threads\.(net|com)$/.test(host)) channel = 'threads';
      else if (/(^|\.)instagram\.com$/.test(host)) channel = 'instagram';
    } catch (_) {}
  }
  // Untagged traffic cannot reliably be identified as direct (apps may hide referrers).
  var label = channel || (source ? 'other_campaign' : 'untagged');
  if (typeof window.clarity === 'function') {
    window.clarity('set', 'promotion_channel', label);
    if (channel) window.clarity('event', 'promotion_visit_' + channel);
  }
})();
