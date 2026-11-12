/* Home layout only: group the brand above a roomy two-column menu. */
(function(){var box=document.querySelector('#home .homeBox'),intro=document.createElement('header');intro.className='homeIntro';box.prepend(intro);['.homeMark','.homeEyebrow','.homeTitle','.homeSub'].forEach(function(selector){var e=box.querySelector(selector);if(e)intro.appendChild(e);});})();
